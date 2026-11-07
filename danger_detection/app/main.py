"""
Danger Detection desktop monitor (Tkinter).

Layout
  header   logo · title · status pill · clock
  left     camera panel: info strip, live video (or placeholder / error), hazard
           banner, live detection chips
  right    actions · live detections · session · settings · web app · activity log
  footer   model / database paths · keyboard shortcuts
"""

from __future__ import annotations

import os
import queue
import sys
import threading
import time
import tkinter as tk
import urllib.request
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional

from PIL import Image, ImageTk

from danger_detection.app import ui
from danger_detection.app.alert_notify import push_alert_to_pwa
from danger_detection.app.detector import FireSmokeDetector, FramePacket
from danger_detection.app.ui import (
    AMBER,
    BG,
    CRIT,
    CRIT_BG,
    CRIT_BG_2,
    FIRE,
    GOOD,
    LINE,
    MUTED,
    NIGHT,
    OBJECTS,
    PEOPLE,
    SMOKE,
    SUNKEN,
    SURFACE,
    TEXT,
    TEXT_2,
    WARN,
    Card,
    FlatButton,
    Fonts,
    Metric,
    Slider,
    Stepper,
    Toggle,
)
from danger_detection.app.utils import bgr_to_rgb, package_root, resize_to_fit

DEFAULT_ALERT_URL = "http://127.0.0.1:8000/internal/alert"


def _maybe_print_pwa_tip() -> None:
    """Explain that the desktop app does not start the API; the PWA needs uvicorn."""
    if os.environ.get("DANGER_DETECTION_NO_PWA_TIP", "").strip():
        return
    print(
        "\nTip: The web app talks to the API on port 8000. This window only runs the camera.\n"
        "In another terminal (repo root, venv active):\n"
        "  uvicorn danger_detection.app.pwa_server:app --host 127.0.0.1 --port 8000\n"
        "Then open http://localhost:8000 — alerts from this app POST to that server.\n"
        "(Suppress this message: export DANGER_DETECTION_NO_PWA_TIP=1)\n",
        file=sys.stderr,
    )


def _alert_url() -> str:
    return os.environ.get("DANGER_DETECTION_ALERT_URL", DEFAULT_ALERT_URL).strip()


def _server_base() -> Optional[str]:
    url = _alert_url()
    if not url or url.lower() in ("0", "false", "off", "no"):
        return None
    return url.split("/internal/alert")[0].rstrip("/")


def _fmt_duration(seconds: float) -> str:
    s = int(seconds)
    h, rem = divmod(s, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


class DangerDetectionApp:
    POLL_MS = 33
    HAZARD_HOLD_S = 2.0  # keep the banner up briefly after the last hazard frame

    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("Danger Detection — Desktop Monitor")
        self.root.geometry("1320x840")
        self.root.minsize(1080, 720)
        self.root.configure(bg=BG)
        self.f = Fonts(self.root)

        # state
        self.forward_alerts = True
        self.sound_enabled = True
        self.alerts_sent = 0
        self.last_alert_at: Optional[float] = None
        self.frames = 0
        self.session_start: Optional[float] = None
        self.fps = 0.0
        self._fps_window: list = []
        self._last_packet: Optional[FramePacket] = None
        self._hazard_until = 0.0
        self._hazard_active = False
        self._unusual_active = False
        self._flash = False
        self._photo: Optional[ImageTk.PhotoImage] = None
        self._poll_job: Optional[str] = None
        self._events: "queue.Queue[tuple]" = queue.Queue()  # worker thread → UI
        self.server_state = "unknown"  # online / offline / disabled / unknown

        self.detector = FireSmokeDetector(on_alert=self._on_detector_alert)

        self._build()
        self._bind_keys()
        self._log("info", "Ready. Press Space or Start monitoring to begin.")
        self._tick()
        self._check_server()
        _maybe_print_pwa_tip()

    # ================================================================ layout
    def _build(self) -> None:
        f = self.f
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(1, weight=1)

        # ---------------- header
        head = tk.Frame(self.root, bg=BG)
        head.grid(row=0, column=0, sticky="ew", padx=22, pady=(16, 12))
        logo = tk.Canvas(head, bg=BG, highlightthickness=0)
        ui.draw_logo(logo, 38)
        logo.pack(side=tk.LEFT)
        titles = tk.Frame(head, bg=BG)
        titles.pack(side=tk.LEFT, padx=(12, 0))
        tk.Label(titles, text="DANGER DETECTION", bg=BG, fg=TEXT, font=f(11, "bold")).pack(anchor="w")
        tk.Label(titles, text="Desktop monitor · fire, smoke & movement", bg=BG, fg=MUTED, font=f(9)).pack(anchor="w")

        right = tk.Frame(head, bg=BG)
        right.pack(side=tk.RIGHT)
        self.clock = tk.Label(right, text="", bg=BG, fg=TEXT_2, font=f(11, family="mono"))
        self.clock.pack(side=tk.RIGHT, padx=(14, 0))
        self.pill = tk.Label(right, text="●  STANDBY", bg=SUNKEN, fg=MUTED, font=f(9, "bold"), padx=12, pady=5)
        self.pill.pack(side=tk.RIGHT)

        # ---------------- body
        body = tk.Frame(self.root, bg=BG)
        body.grid(row=1, column=0, sticky="nsew", padx=22)
        body.columnconfigure(0, weight=1)
        body.columnconfigure(1, weight=0, minsize=340)
        body.rowconfigure(0, weight=1)

        self._build_camera(body)
        self._build_sidebar(body)

        # ---------------- footer
        foot = tk.Frame(self.root, bg=BG)
        foot.grid(row=2, column=0, sticky="ew", padx=22, pady=(10, 12))
        model = getattr(self.detector, "model_path", None)
        db = getattr(self.detector, "_db_path", None)
        tk.Label(
            foot,
            text=f"Model  {Path(str(model)).name if model else '—'}      Database  {db if db else '—'}",
            bg=BG,
            fg=MUTED,
            font=f(9, family="mono"),
        ).pack(side=tk.LEFT)
        tk.Label(
            foot,
            text="Space  start/stop     S  snapshot     F11  full screen     Ctrl+Q  quit",
            bg=BG,
            fg=MUTED,
            font=f(9),
        ).pack(side=tk.RIGHT)

        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    def _build_camera(self, parent: tk.Frame) -> None:
        f = self.f
        card = tk.Frame(parent, bg=SURFACE, highlightthickness=1, highlightbackground=LINE)
        card.grid(row=0, column=0, sticky="nsew", padx=(0, 16))
        card.rowconfigure(1, weight=1)
        card.columnconfigure(0, weight=1)

        # info strip
        strip = tk.Frame(card, bg=SURFACE)
        strip.grid(row=0, column=0, sticky="ew", padx=16, pady=12)
        self.rec_dot = tk.Label(strip, text="●", bg=SURFACE, fg=MUTED, font=f(11))
        self.rec_dot.pack(side=tk.LEFT)
        self.cam_title = tk.Label(strip, text="CAMERA 0", bg=SURFACE, fg=TEXT, font=f(10, "bold"))
        self.cam_title.pack(side=tk.LEFT, padx=(6, 10))
        self.cam_state = tk.Label(strip, text="Offline", bg=SUNKEN, fg=MUTED, font=f(9, "bold"), padx=8, pady=2)
        self.cam_state.pack(side=tk.LEFT)
        self.cam_meta = tk.Label(strip, text="", bg=SURFACE, fg=MUTED, font=f(9, family="mono"))
        self.cam_meta.pack(side=tk.RIGHT)

        # video stage
        self.stage = tk.Frame(card, bg="#000000")
        self.stage.grid(row=1, column=0, sticky="nsew", padx=1)
        self.video = tk.Label(self.stage, bg="#000000", bd=0)
        self.video.place(relx=0.5, rely=0.5, anchor="center")

        self.placeholder = tk.Frame(self.stage, bg="#000000")
        self.placeholder.place(relx=0.5, rely=0.5, anchor="center")
        ph_logo = tk.Canvas(self.placeholder, bg="#000000", highlightthickness=0)
        ui.draw_logo(ph_logo, 64)
        ph_logo.pack(pady=(0, 14))
        self.ph_title = tk.Label(self.placeholder, text="Camera is off", bg="#000000", fg=TEXT, font=f(20, family="display"))
        self.ph_title.pack()
        self.ph_text = tk.Label(
            self.placeholder,
            text="Start monitoring to stream the camera and detect fire, smoke and people.",
            bg="#000000",
            fg=MUTED,
            font=f(10),
            wraplength=420,
            justify=tk.CENTER,
        )
        self.ph_text.pack(pady=(6, 16))
        self.ph_button = FlatButton(self.placeholder, "Start monitoring", self._on_start, f, "primary", icon="▶")
        self.ph_button.pack()

        # hazard banner (overlay on top of the video)
        self.banner = tk.Frame(self.stage, bg=CRIT_BG_2)
        self.banner_title = tk.Label(self.banner, text="", bg=CRIT_BG_2, fg="#ffffff", font=f(13, "bold"))
        self.banner_title.pack(side=tk.LEFT, padx=(16, 10), pady=10)
        self.banner_sub = tk.Label(self.banner, text="", bg=CRIT_BG_2, fg="#ffd9d2", font=f(10))
        self.banner_sub.pack(side=tk.LEFT, pady=10)

        # detection chips
        chips = tk.Frame(card, bg=SURFACE)
        chips.grid(row=2, column=0, sticky="ew", padx=16, pady=12)
        self.chips = {}
        for key, label, colour in (
            ("fire", "Fire", FIRE),
            ("smoke", "Smoke", SMOKE),
            ("people", "People", PEOPLE),
            ("objects", "Objects", OBJECTS),
        ):
            chip = tk.Frame(chips, bg=SUNKEN)
            chip.pack(side=tk.LEFT, padx=(0, 8))
            dot = tk.Label(chip, text="■", bg=SUNKEN, fg=colour, font=f(9))
            dot.pack(side=tk.LEFT, padx=(10, 4), pady=4)
            val = tk.Label(chip, text=f"{label}  0", bg=SUNKEN, fg=TEXT_2, font=f(9, "bold"))
            val.pack(side=tk.LEFT, padx=(0, 10), pady=4)
            self.chips[key] = (val, label)
        self.unusual_chip = tk.Label(chips, text="", bg=SURFACE, fg=WARN, font=f(9, "bold"))
        self.unusual_chip.pack(side=tk.LEFT, padx=(6, 0))
        self.summary = tk.Label(chips, text="", bg=SURFACE, fg=MUTED, font=f(9, family="mono"))
        self.summary.pack(side=tk.RIGHT)

    def _build_sidebar(self, parent: tk.Frame) -> None:
        f = self.f
        side = tk.Frame(parent, bg=BG, width=340)
        side.grid(row=0, column=1, sticky="nsew")
        side.grid_propagate(False)
        side.columnconfigure(0, weight=1)
        side.rowconfigure(4, weight=1)

        # ---- actions
        actions = Card(side, f, "Actions")
        actions.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        self.btn_main = FlatButton(actions.body, "Start monitoring", self._toggle, f, "primary", icon="▶", size=11, pad=(14, 11))
        self.btn_main.pack(fill=tk.X)
        row = tk.Frame(actions.body, bg=SURFACE)
        row.pack(fill=tk.X, pady=(8, 0))
        row.columnconfigure((0, 1), weight=1)
        self.btn_snap = FlatButton(row, "Snapshot", self._snapshot, f, "ghost", icon="◉", size=9)
        self.btn_snap.grid(row=0, column=0, sticky="ew", padx=(0, 4))
        self.btn_snap.set(enabled=False)
        FlatButton(row, "Web dashboard", self._open_dashboard, f, "ghost", icon="↗", size=9).grid(row=0, column=1, sticky="ew", padx=(4, 0))
        self.btn_test = FlatButton(actions.body, "Send test alert to web app", self._test_alert, f, "outline", icon="!", size=9)
        self.btn_test.pack(fill=tk.X, pady=(8, 0))

        # ---- live detections + session
        live = Card(side, f, "Live detections", right="this frame")
        live.grid(row=1, column=0, sticky="ew", pady=(0, 10))
        grid = tk.Frame(live.body, bg=SURFACE)
        grid.pack(fill=tk.X)
        grid.columnconfigure((0, 1), weight=1)
        self.m_fire = Metric(grid, f, "Fire", FIRE)
        self.m_smoke = Metric(grid, f, "Smoke", SMOKE)
        self.m_people = Metric(grid, f, "People", PEOPLE)
        self.m_objects = Metric(grid, f, "Objects", OBJECTS)
        for i, m in enumerate((self.m_fire, self.m_smoke, self.m_people, self.m_objects)):
            m.grid(row=i // 2, column=i % 2, sticky="ew", padx=(0 if i % 2 == 0 else 4, 4 if i % 2 == 0 else 0), pady=(0, 8))
        stats = tk.Frame(live.body, bg=SURFACE)
        stats.pack(fill=tk.X, pady=(4, 0))
        self.stat_labels = {}
        for i, (key, label) in enumerate((("uptime", "Session"), ("fps", "FPS"), ("frames", "Frames"), ("alerts", "Alerts sent"))):
            cell = tk.Frame(stats, bg=SURFACE)
            cell.grid(row=0, column=i, sticky="w", padx=(0, 14))
            tk.Label(cell, text=label, bg=SURFACE, fg=MUTED, font=f(8)).pack(anchor="w")
            v = tk.Label(cell, text="—", bg=SURFACE, fg=TEXT, font=f(10, "bold", "mono"))
            v.pack(anchor="w")
            self.stat_labels[key] = v

        # ---- settings
        settings = Card(side, f, "Settings")
        settings.grid(row=2, column=0, sticky="ew", pady=(0, 10))
        cam_row = tk.Frame(settings.body, bg=SURFACE)
        cam_row.pack(fill=tk.X)
        tk.Label(cam_row, text="Camera", bg=SURFACE, fg=TEXT, font=f(10, "bold")).pack(side=tk.LEFT)
        self.cam_stepper = Stepper(cam_row, f, int(self.detector.camera_index), 0, 9, self._set_camera)
        self.cam_stepper.pack(side=tk.RIGHT)

        thr_head = tk.Frame(settings.body, bg=SURFACE)
        thr_head.pack(fill=tk.X, pady=(12, 0))
        tk.Label(thr_head, text="Confidence threshold", bg=SURFACE, fg=TEXT, font=f(10, "bold")).pack(side=tk.LEFT)
        self.thr_val = tk.Label(thr_head, text=f"{self.detector.conf_threshold:.2f}", bg=SURFACE, fg=AMBER, font=f(10, "bold", "mono"))
        self.thr_val.pack(side=tk.RIGHT)
        Slider(settings.body, 0.10, 0.90, float(self.detector.conf_threshold), self._set_threshold, step=0.05).pack(fill=tk.X, pady=(6, 2))
        tk.Label(settings.body, text="Lower finds more, with more false alarms. Applies instantly.", bg=SURFACE, fg=MUTED, font=f(8), anchor="w").pack(fill=tk.X)

        Toggle(settings.body, f, "Forward alerts", "Send fire and smoke alerts to the web app", True, self._set_forward).pack(fill=tk.X, pady=(12, 0))
        Toggle(settings.body, f, "Alert sound", "Beep when a new hazard appears", True, self._set_sound).pack(fill=tk.X, pady=(10, 0))

        # ---- web app connection
        conn = tk.Frame(side, bg=NIGHT, highlightthickness=1, highlightbackground="#22413f")
        conn.grid(row=3, column=0, sticky="ew", pady=(0, 10))
        inner = tk.Frame(conn, bg=NIGHT)
        inner.pack(fill=tk.X, padx=16, pady=12)
        top = tk.Frame(inner, bg=NIGHT)
        top.pack(fill=tk.X)
        tk.Label(top, text="WEB APP", bg=NIGHT, fg=AMBER, font=f(9, "bold")).pack(side=tk.LEFT)
        self.server_pill = tk.Label(top, text="checking…", bg="#24302e", fg=TEXT_2, font=f(8, "bold"), padx=8, pady=1)
        self.server_pill.pack(side=tk.RIGHT)
        self.server_text = tk.Label(inner, text=_server_base() or "Alert forwarding disabled", bg=NIGHT, fg="#cfe0dc", font=f(9, family="mono"), anchor="w")
        self.server_text.pack(fill=tk.X, pady=(6, 0))

        # ---- activity log
        log = Card(side, f, "Activity")
        log.grid(row=4, column=0, sticky="nsew")
        self.log = tk.Text(
            log.body,
            bg=SURFACE,
            fg=TEXT_2,
            bd=0,
            highlightthickness=0,
            font=f(9),
            wrap=tk.WORD,
            height=6,
            cursor="arrow",
            padx=0,
            pady=0,
            spacing1=2,
            spacing3=4,
        )
        self.log.pack(fill=tk.BOTH, expand=True)
        self.log.tag_configure("time", foreground=MUTED, font=f(9, family="mono"))
        for tag, colour in (("info", TEXT_2), ("good", GOOD), ("warn", WARN), ("crit", CRIT), ("fire", FIRE)):
            self.log.tag_configure(tag, foreground=colour)
        self.log.configure(state=tk.DISABLED)

    def _bind_keys(self) -> None:
        r = self.root
        r.bind("<space>", lambda _e: self._toggle())
        r.bind("<KeyPress-s>", lambda _e: self._snapshot())
        r.bind("<F11>", lambda _e: r.attributes("-fullscreen", not r.attributes("-fullscreen")))
        r.bind("<Escape>", lambda _e: r.attributes("-fullscreen", False))
        r.bind("<Control-q>", lambda _e: self._on_close())
        if sys.platform == "darwin":
            r.bind("<Command-q>", lambda _e: self._on_close())

    # ================================================================ state
    def _log(self, kind: str, text: str) -> None:
        stamp = datetime.now().strftime("%H:%M:%S")
        self.log.configure(state=tk.NORMAL)
        self.log.insert("1.0", f"{text}\n", (kind,))
        self.log.insert("1.0", f"{stamp}  ", ("time",))
        # keep the newest 200 lines
        if int(self.log.index("end-1c").split(".")[0]) > 200:
            self.log.delete("201.0", tk.END)
        self.log.configure(state=tk.DISABLED)

    def _set_pill(self, mode: str) -> None:
        styles = {
            "standby": ("●  STANDBY", SUNKEN, MUTED),
            "starting": ("●  STARTING", "#3a3020", WARN),
            "live": ("●  LIVE", "#143326", GOOD),
            "alert": ("▲  HAZARD", CRIT_BG, CRIT),
            "error": ("■  ERROR", "#3a3020", WARN),
        }
        text, bg, fg = styles[mode]
        self.pill.configure(text=text, bg=bg, fg=fg)

    def _set_running_ui(self, running: bool) -> None:
        if running:
            self.btn_main.set(text="■  Stop monitoring", variant="danger")
        else:
            self.btn_main.set(text="▶  Start monitoring", variant="primary")
        self.btn_snap.set(enabled=running)
        self.cam_stepper.set_enabled(not running)
        self.cam_state.configure(text="Live" if running else "Offline", bg="#143326" if running else SUNKEN, fg=GOOD if running else MUTED)

    def _show_placeholder(self, title: str, text: str, error: bool = False) -> None:
        self.video.configure(image="")
        self._photo = None
        self.ph_title.configure(text=title, fg=CRIT if error else TEXT)
        self.ph_text.configure(text=text)
        self.ph_button.set(text="↻  Try again" if error else "▶  Start monitoring")
        self.placeholder.place(relx=0.5, rely=0.5, anchor="center")
        self.placeholder.lift()
        self.banner.place_forget()

    # ================================================================ actions
    def _toggle(self) -> None:
        if self.detector.is_running():
            self._on_stop()
        else:
            self._on_start()

    def _on_start(self) -> None:
        if self.detector.is_running():
            return
        self._set_pill("starting")
        self.ph_title.configure(text="Starting camera…", fg=TEXT)
        self.ph_text.configure(text="Loading YOLO models. This can take a few seconds the first time.")
        self.root.update_idletasks()
        try:
            self.detector.start()
        except FileNotFoundError as e:
            self._fail(f"Model not found: {e}", "Place your weights at danger_detection/models/fire_smoke.pt or set DANGER_DETECTION_MODEL.")
            return
        except Exception as e:  # noqa: BLE001 - surface any startup failure in the UI
            self._fail(str(e), "Check the camera is connected and not in use, or pick another camera in Settings.")
            return
        self.session_start = time.monotonic()
        self.frames = 0
        self.alerts_sent = 0
        self._fps_window.clear()
        self._set_running_ui(True)
        self._set_pill("live")
        self.ph_title.configure(text="Waiting for frames…")
        self.ph_text.configure(text=f"Opening camera {self.detector.camera_index}.")
        self._log("good", f"Monitoring started on camera {self.detector.camera_index}.")
        self._schedule_poll()

    def _fail(self, message: str, hint: str) -> None:
        self._set_pill("error")
        self._set_running_ui(False)
        self._show_placeholder("Couldn't start monitoring", f"{message}\n\n{hint}", error=True)
        self._log("crit", message)

    def _on_stop(self, reason: str = "Monitoring stopped.") -> None:
        if self._poll_job is not None:
            self.root.after_cancel(self._poll_job)
            self._poll_job = None
        self.detector.stop()
        self._hazard_active = False
        self._set_running_ui(False)
        self._set_pill("standby")
        self._show_placeholder("Camera is off", "Start monitoring to stream the camera and detect fire, smoke and people.")
        for m in (self.m_fire, self.m_smoke, self.m_people, self.m_objects):
            m.set(0)
        for val, label in self.chips.values():
            val.configure(text=f"{label}  0", fg=MUTED)
        self._unusual_active = False
        self.unusual_chip.configure(text="")
        self.summary.configure(text="")
        self.cam_meta.configure(text="")
        self._last_packet = None
        self._log("info", reason)

    def _snapshot(self) -> None:
        pkt = self._last_packet
        if pkt is None or not self.detector.is_running():
            return
        folder = package_root() / "data" / "snapshots"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"snapshot-{datetime.now().strftime('%Y%m%d-%H%M%S')}.png"
        Image.fromarray(bgr_to_rgb(pkt.frame_bgr)).save(path)
        self._log("good", f"Snapshot saved: {path.name}")

    def _open_dashboard(self) -> None:
        base = _server_base() or "http://127.0.0.1:8000"
        webbrowser.open(base + "/")
        self._log("info", f"Opened {base} in the browser.")

    def _test_alert(self) -> None:
        if not _server_base():
            self._log("warn", "Alert forwarding is disabled (DANGER_DETECTION_ALERT_URL).")
            return
        push_alert_to_pwa(1, 0)
        self._log("warn", "Test alert sent to the web app (fire ×1).")

    def _set_camera(self, idx: int) -> None:
        self.detector.camera_index = idx
        self.cam_title.configure(text=f"CAMERA {idx}")

    def _set_threshold(self, v: float) -> None:
        self.detector.conf_threshold = v
        self.thr_val.configure(text=f"{v:.2f}")

    def _set_forward(self, v: bool) -> None:
        self.forward_alerts = v
        self._log("info", "Alert forwarding on." if v else "Alert forwarding paused. Hazards still show here.")

    def _set_sound(self, v: bool) -> None:
        self.sound_enabled = v

    # ================================================================ detector → UI
    def _on_detector_alert(self, fire: int, smoke: int) -> None:
        """Runs on the detector thread (debounced by the detector)."""
        if self.forward_alerts:
            push_alert_to_pwa(fire, smoke)
            self._events.put(("sent", fire, smoke))

    def _schedule_poll(self) -> None:
        self._poll_job = self.root.after(self.POLL_MS, self._poll_loop)

    def _poll_loop(self) -> None:
        err = self.detector.get_error()
        if err:
            self._poll_job = None
            self.detector.stop()
            self._fail(err, "Check the camera is connected and not in use, or pick another camera in Settings.")
            return

        while not self._events.empty():
            kind, fire, smoke = self._events.get_nowait()
            if kind == "sent":
                self.alerts_sent += 1
                self.last_alert_at = time.time()

        packet = self.detector.poll_frame()
        if packet is not None:
            self._show_frame(packet)

        if self.detector.is_running():
            self._schedule_poll()
        else:
            self._poll_job = None
            self._on_stop("Monitoring ended.")

    def _show_frame(self, packet: FramePacket) -> None:
        self._last_packet = packet
        now = time.monotonic()
        self.frames += 1
        self._fps_window.append(now)
        self._fps_window = [t for t in self._fps_window if now - t <= 2.0]
        self.fps = len(self._fps_window) / 2.0

        sw = max(160, self.stage.winfo_width())
        sh = max(120, self.stage.winfo_height())
        resized, _ = resize_to_fit(packet.frame_bgr, sw, sh)
        self._photo = ImageTk.PhotoImage(image=Image.fromarray(bgr_to_rgb(resized)))
        self.video.configure(image=self._photo)
        self.video.lift()
        self.placeholder.place_forget()

        h, w = packet.frame_bgr.shape[:2]
        self.cam_meta.configure(text=f"{w}×{h}  ·  {self.fps:4.1f} fps")

        fire, smoke = packet.fire_count, packet.smoke_count
        self.m_fire.set(fire)
        self.m_smoke.set(smoke)
        self.m_people.set(packet.person_count)
        self.m_objects.set(packet.general_object_count)
        for key, n in (("fire", fire), ("smoke", smoke), ("people", packet.person_count), ("objects", packet.general_object_count)):
            val, label = self.chips[key]
            val.configure(text=f"{label}  {n}", fg=TEXT if n else MUTED)
        self.summary.configure(text=packet.summary)

        if packet.unusual_activity and not self._unusual_active:
            self._log("warn", "Unusual movement detected.")
        self._unusual_active = packet.unusual_activity
        self.unusual_chip.configure(text="▲ Unusual movement" if packet.unusual_activity else "")

        if fire or smoke:
            if not self._hazard_active:
                what = "Fire & smoke" if fire and smoke else "Fire" if fire else "Smoke"
                self._log("fire", f"{what} detected (fire {fire}, smoke {smoke}).")
                if self.sound_enabled:
                    self.root.bell()
            self._hazard_active = True
            self._hazard_until = now + self.HAZARD_HOLD_S
            title = "FIRE & SMOKE DETECTED" if fire and smoke else "FIRE DETECTED" if fire else "SMOKE DETECTED"
            self.banner_title.configure(text=f"▲  {title}")
            self.banner_sub.configure(
                text="Alert forwarded to the web app" if self.forward_alerts and _server_base() else "Alert forwarding is off"
            )
            self.banner.place(relx=0, rely=0, relwidth=1)
            self.banner.lift()
        elif self._hazard_active and now > self._hazard_until:
            self._hazard_active = False
            self.banner.place_forget()
            self._log("good", "Scene clear.")

    # ================================================================ timers
    def _tick(self) -> None:
        """1 Hz-ish housekeeping: clock, session stats, banner flash, REC blink."""
        self.clock.configure(text=datetime.now().strftime("%H:%M:%S"))
        running = self.detector.is_running()
        if running and self.session_start is not None:
            self.stat_labels["uptime"].configure(text=_fmt_duration(time.monotonic() - self.session_start))
            self.stat_labels["fps"].configure(text=f"{self.fps:.1f}")
            self.stat_labels["frames"].configure(text=f"{self.frames:,}")
            self.stat_labels["alerts"].configure(text=str(self.alerts_sent))
        self._flash = not self._flash
        self.rec_dot.configure(fg=(CRIT if self._flash else "#5a2a25") if running else MUTED)
        if self._hazard_active:
            colour = CRIT_BG_2 if self._flash else "#7a2618"
            for w in (self.banner, self.banner_title, self.banner_sub):
                w.configure(bg=colour)
            self._set_pill("alert")
        elif running and self.pill.cget("text").startswith("▲"):
            self._set_pill("live")
        self.root.after(500, self._tick)

    def _check_server(self) -> None:
        """Pings /health on the alert server every 10 s in a background thread."""
        base = _server_base()

        def work() -> None:
            state = "disabled"
            if base:
                try:
                    with urllib.request.urlopen(base + "/health", timeout=2) as r:
                        state = "online" if r.status == 200 else "offline"
                except Exception:  # noqa: BLE001 - any failure means unreachable
                    state = "offline"
            self.root.after(0, lambda: self._set_server(state))

        threading.Thread(target=work, daemon=True).start()
        self.root.after(10_000, self._check_server)

    def _set_server(self, state: str) -> None:
        if state != self.server_state and self.server_state != "unknown":
            self._log("good" if state == "online" else "warn", f"Web app server {state}.")
        self.server_state = state
        text, bg, fg = {
            "online": ("● ONLINE", "#143326", GOOD),
            "offline": ("● OFFLINE", "#3a1712", CRIT),
            "disabled": ("DISABLED", "#24302e", MUTED),
        }[state]
        self.server_pill.configure(text=text, bg=bg, fg=fg)

    # ================================================================ lifecycle
    def _on_close(self) -> None:
        if self._poll_job is not None:
            self.root.after_cancel(self._poll_job)
        self.detector.stop()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    DangerDetectionApp().run()


if __name__ == "__main__":
    main()
