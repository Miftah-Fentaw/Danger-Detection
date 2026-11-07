"""
Theme and small custom Tk widgets for the desktop monitor.

Native Tk buttons ignore background colours on macOS, so buttons, toggles and the
slider are drawn from plain Labels / Canvases to look the same on every OS.
Palette matches the landing page and web app (dark theme).
"""

from __future__ import annotations

import tkinter as tk
import tkinter.font as tkfont
from typing import Callable, Optional, Sequence

# ---------------------------------------------------------------- palette
BG = "#111312"
SURFACE = "#171a18"
SURFACE_2 = "#1d201e"
SUNKEN = "#242825"
LINE = "#2b302c"
TEXT = "#f1ece4"
TEXT_2 = "#cdc7bd"
MUTED = "#938d84"
ACCENT = "#e8955a"  # ember
AMBER = "#ffb066"
NIGHT = "#0f1a19"
NIGHT_2 = "#1b3335"

FIRE = "#e06d33"
SMOKE = "#5a8bd0"
GOOD = "#4ccb8c"
WARN = "#f0b44c"
CRIT = "#ff6b5e"
CRIT_BG = "#3a1712"
CRIT_BG_2 = "#5a1f15"
PEOPLE = "#b9a3e3"
OBJECTS = "#8ec9c0"


def _pick(root: tk.Misc, names: Sequence[str], fallback: str) -> str:
    available = {f.lower(): f for f in tkfont.families(root)}
    for n in names:
        if n.lower() in available:
            return available[n.lower()]
    return fallback


class Fonts:
    """Resolved font families (Tk tuples must name a single family)."""

    def __init__(self, root: tk.Misc) -> None:
        self.ui = _pick(root, ["Inter", "SF Pro Text", "Helvetica Neue", "Segoe UI", "Ubuntu", "DejaVu Sans"], "Helvetica")
        self.display = _pick(
            root, ["Playfair Display", "Iowan Old Style", "Palatino", "Georgia", "DejaVu Serif"], "Times"
        )
        self.mono = _pick(root, ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "DejaVu Sans Mono"], "Courier")

    def __call__(self, size: int, weight: str = "normal", family: str = "ui") -> tuple:
        fam = {"ui": self.ui, "display": self.display, "mono": self.mono}[family]
        return (fam, size, weight) if weight != "normal" else (fam, size)


# ---------------------------------------------------------------- widgets
class Card(tk.Frame):
    """Flat surface with a hairline border and an optional uppercase title."""

    def __init__(self, master: tk.Misc, fonts: Fonts, title: str = "", right: str = "", bg: str = SURFACE, **kw) -> None:
        super().__init__(master, bg=bg, highlightthickness=1, highlightbackground=LINE, **kw)
        self.fonts = fonts
        self.body = tk.Frame(self, bg=bg)
        if title:
            head = tk.Frame(self, bg=bg)
            head.pack(fill=tk.X, padx=16, pady=(14, 0))
            tk.Label(head, text=title.upper(), bg=bg, fg=ACCENT, font=fonts(9, "bold")).pack(side=tk.LEFT)
            self.right_label = tk.Label(head, text=right, bg=bg, fg=MUTED, font=fonts(9))
            self.right_label.pack(side=tk.RIGHT)
        self.body.pack(fill=tk.BOTH, expand=True, padx=16, pady=(10, 14))


class FlatButton(tk.Label):
    """Colour-reliable button with hover, press and disabled states."""

    VARIANTS = {
        # bg, fg, hover bg
        "primary": (TEXT, BG, "#ffffff"),
        "danger": (CRIT, "#1a0b08", "#ff857a"),
        "ghost": (SUNKEN, TEXT, "#2f3430"),
        "outline": (SURFACE, TEXT, SUNKEN),
    }

    def __init__(
        self,
        master: tk.Misc,
        text: str,
        command: Callable[[], None],
        fonts: Fonts,
        variant: str = "ghost",
        icon: str = "",
        size: int = 10,
        pad=(14, 9),
        anchor: str = "center",
    ) -> None:
        self._command = command
        self._enabled = True
        self._variant = variant
        bg, fg, _ = self.VARIANTS[variant]
        super().__init__(
            master,
            text=f"{icon}  {text}" if icon else text,
            bg=bg,
            fg=fg,
            font=fonts(size, "bold"),
            padx=pad[0],
            pady=pad[1],
            cursor="hand2",
            anchor=anchor,
            highlightthickness=1 if variant == "outline" else 0,
            highlightbackground=LINE,
        )
        self.bind("<Enter>", lambda _e: self._paint(hover=True))
        self.bind("<Leave>", lambda _e: self._paint())
        self.bind("<ButtonRelease-1>", self._click)

    def _paint(self, hover: bool = False) -> None:
        bg, fg, hov = self.VARIANTS[self._variant]
        if not self._enabled:
            self.configure(bg=SUNKEN, fg="#5d5a54", cursor="arrow")
        else:
            self.configure(bg=hov if hover else bg, fg=fg, cursor="hand2")

    def _click(self, _e=None) -> None:
        if self._enabled:
            self._command()

    def set(self, text: Optional[str] = None, variant: Optional[str] = None, enabled: Optional[bool] = None) -> None:
        if text is not None:
            self.configure(text=text)
        if variant is not None:
            self._variant = variant
        if enabled is not None:
            self._enabled = enabled
        self._paint()


class Toggle(tk.Frame):
    """Label + hint on the left, pill switch on the right."""

    W, H = 40, 22

    def __init__(self, master: tk.Misc, fonts: Fonts, label: str, hint: str, value: bool, on_change: Callable[[bool], None], bg: str = SURFACE) -> None:
        super().__init__(master, bg=bg)
        self.value = value
        self._on_change = on_change
        text = tk.Frame(self, bg=bg)
        text.pack(side=tk.LEFT, fill=tk.X, expand=True)
        tk.Label(text, text=label, bg=bg, fg=TEXT, font=fonts(10, "bold"), anchor="w").pack(fill=tk.X)
        tk.Label(text, text=hint, bg=bg, fg=MUTED, font=fonts(9), anchor="w", justify=tk.LEFT, wraplength=220).pack(fill=tk.X)
        self.cv = tk.Canvas(self, width=self.W, height=self.H, bg=bg, highlightthickness=0, cursor="hand2")
        self.cv.pack(side=tk.RIGHT, padx=(10, 0))
        for w in (self, self.cv, text):
            w.bind("<ButtonRelease-1>", self._flip)
        self._draw()

    def _flip(self, _e=None) -> None:
        self.value = not self.value
        self._draw()
        self._on_change(self.value)

    def _draw(self) -> None:
        c, w, h, r = self.cv, self.W, self.H, self.H / 2
        c.delete("all")
        fill = GOOD if self.value else "#3a3f3b"
        c.create_oval(0, 0, h, h, fill=fill, outline=fill)
        c.create_oval(w - h, 0, w, h, fill=fill, outline=fill)
        c.create_rectangle(r, 0, w - r, h, fill=fill, outline=fill)
        x = w - h + 3 if self.value else 3
        c.create_oval(x, 3, x + h - 6, h - 3, fill="#ffffff", outline="#ffffff")


class Slider(tk.Canvas):
    """Minimal horizontal slider (drag or click), value in [lo, hi]."""

    def __init__(self, master: tk.Misc, lo: float, hi: float, value: float, on_change: Callable[[float], None], step: float = 0.01, bg: str = SURFACE, width: int = 240) -> None:
        super().__init__(master, height=22, width=width, bg=bg, highlightthickness=0, cursor="hand2")
        self.lo, self.hi, self.step = lo, hi, step
        self.value = value
        self._on_change = on_change
        self.bind("<Configure>", lambda _e: self._draw())
        self.bind("<Button-1>", self._set_from)
        self.bind("<B1-Motion>", self._set_from)
        self._draw()

    def _set_from(self, e) -> None:
        w = max(1, self.winfo_width() - 16)
        frac = min(1.0, max(0.0, (e.x - 8) / w))
        v = self.lo + frac * (self.hi - self.lo)
        v = round(round(v / self.step) * self.step, 4)
        if v != self.value:
            self.value = v
            self._draw()
            self._on_change(v)

    def _draw(self) -> None:
        self.delete("all")
        w = max(20, self.winfo_width())
        y = 11
        frac = (self.value - self.lo) / (self.hi - self.lo)
        x = 8 + frac * (w - 16)
        self.create_line(8, y, w - 8, y, fill="#3a3f3b", width=4, capstyle=tk.ROUND)
        self.create_line(8, y, x, y, fill=AMBER, width=4, capstyle=tk.ROUND)
        self.create_oval(x - 8, y - 8, x + 8, y + 8, fill="#ffffff", outline=AMBER, width=2)


class Stepper(tk.Frame):
    """[-] value [+] integer control."""

    def __init__(self, master: tk.Misc, fonts: Fonts, value: int, lo: int, hi: int, on_change: Callable[[int], None], bg: str = SURFACE) -> None:
        super().__init__(master, bg=bg)
        self.value, self.lo, self.hi = value, lo, hi
        self._on_change = on_change
        self.minus = FlatButton(self, "−", lambda: self._step(-1), fonts, "ghost", pad=(10, 3))
        self.minus.pack(side=tk.LEFT)
        self.label = tk.Label(self, text=str(value), bg=bg, fg=TEXT, font=fonts(11, "bold", "mono"), width=3)
        self.label.pack(side=tk.LEFT)
        self.plus = FlatButton(self, "+", lambda: self._step(1), fonts, "ghost", pad=(10, 3))
        self.plus.pack(side=tk.LEFT)

    def _step(self, d: int) -> None:
        v = min(self.hi, max(self.lo, self.value + d))
        if v != self.value:
            self.value = v
            self.label.configure(text=str(v))
            self._on_change(v)

    def set_enabled(self, enabled: bool) -> None:
        self.minus.set(enabled=enabled)
        self.plus.set(enabled=enabled)
        self.label.configure(fg=TEXT if enabled else MUTED)


class Metric(tk.Frame):
    """Counter tile: coloured accent bar, big number, label."""

    def __init__(self, master: tk.Misc, fonts: Fonts, label: str, colour: str, bg: str = SURFACE_2) -> None:
        super().__init__(master, bg=bg, highlightthickness=1, highlightbackground=LINE)
        self._colour = colour
        self.bar = tk.Frame(self, bg=LINE, width=3)
        self.bar.pack(side=tk.LEFT, fill=tk.Y)
        inner = tk.Frame(self, bg=bg)
        inner.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=12, pady=10)
        self.num = tk.Label(inner, text="0", bg=bg, fg=TEXT, font=fonts(22, "bold"), anchor="w")
        self.num.pack(fill=tk.X)
        tk.Label(inner, text=label, bg=bg, fg=MUTED, font=fonts(9), anchor="w").pack(fill=tk.X)

    def set(self, n: int) -> None:
        self.num.configure(text=str(n))
        self.bar.configure(bg=self._colour if n > 0 else LINE)


def draw_logo(canvas: tk.Canvas, size: int) -> None:
    """Hazard warning sign (same artwork as the web favicon), drawn at `size` px wide."""
    s = size / 100.0
    h = 90 * s

    def pts(*xy: float) -> list:
        return [v * s for v in xy]

    canvas.configure(width=size, height=int(h) + 1)
    canvas.create_polygon(pts(50, 4, 96.5, 85.5, 3.5, 85.5), fill="#FFD400", outline="#111111", width=max(1, 3 * s), joinstyle=tk.ROUND)
    canvas.create_polygon(pts(50, 15.5, 87, 80, 13, 80), fill="#FFD400", outline="#111111", width=max(2, 7 * s), joinstyle=tk.ROUND)
    canvas.create_polygon(pts(45.6, 32, 54.4, 32, 52.8, 61, 47.2, 61), fill="#111111", outline="#111111")
    r = 4.6 * s
    canvas.create_oval(50 * s - r, 70.5 * s - r, 50 * s + r, 70.5 * s + r, fill="#111111", outline="#111111")
