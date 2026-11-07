# Danger Detection — Web Dashboard

The installable web dashboard (PWA) for Danger Detection. It shows live fire and smoke alerts, charts and history from the alert server. It does **not** access the camera or run YOLO; the desktop monitor does that and the FastAPI server relays alerts to this app.

Built with React 19, TypeScript, Vite and [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa).

---

## Contents

- [Quick start](#quick-start)
- [Screens](#screens)
- [Alert panel](#alert-panel)
- [How data flows](#how-data-flows)
- [Configuration](#configuration)
- [Installing on a phone or desktop](#installing-on-a-phone-or-desktop)
- [Offline behaviour](#offline-behaviour)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Quick start

Requirements: Node.js 18+, npm, and the alert server running on port 8000 for live data.

```bash
cd web
npm install
npm run dev            # http://localhost:5173
```

Start the alert server from the repository root in another terminal:

```bash
./run-pwa-server.sh
```

Run the desktop monitor as a third process when you want real camera alerts:

```bash
./run-desktop.sh
```

### Production build

```bash
npm run build          # writes dist/
```

When `web/dist/` exists, the FastAPI server serves it at **http://localhost:8000**, so in production you only run the server and the desktop monitor.

---

## Screens

### Overview

| Section | What it shows |
|---|---|
| **Time range** | 1H, 24H, 7D or 30D. Scopes every figure, chart and table on the page (remembered on this device). |
| **Live status** | *All clear*, *Hazard detected recently* (last 10 minutes), *N alerts need attention*, or *Monitoring paused* when the live connection is down. Shows the alert count for the range and the detector → alert server → this device pipeline with a status for each step. |
| **KPI tiles** | Alerts, fire detections, smoke detections (each with a 12-point trend and the change vs. the previous period) and time since the last hazard. |
| **Detections over time** | Stacked fire/smoke columns (5-minute, hourly or daily buckets). Hover or Tab to a column for exact counts. |
| **Detection mix** | Fire vs. smoke share, alerts containing both, and the busiest period. |
| **Recent events** | The latest six events, with a link to the full list. |
| **Health** | Live channel (uptime and reconnects), alert server (response time and last sync) and detector (time of the last report), each marked Healthy, Degraded or Down. |

### Events

Every alert in the selected range in a sortable table with search and Fire / Smoke filters. **Clear history** asks for confirmation inline and removes the history on the server for everyone. On phones the table turns into stacked cards.

### Settings

| Setting | Description |
|---|---|
| Sound | Two short tones when an alert arrives. |
| Vibration | Vibration pattern on phones that support it (after you have interacted with the page). |
| Open the alerts panel | Slide the alert panel in automatically. |
| System notifications | Show an OS notification when the app is in the background (asks for permission). |
| Preview an alert | Raises a local test alert to check sound and the panel. Nothing is sent to the server. |
| Appearance | System, Light or Dark theme. |
| Connection | Live channel and server addresses with a **Reconnect** button. |

All settings are stored in `localStorage` on this device only.

---

## Alert panel

New hazards slide into a panel on the right instead of a blocking dialog, so the dashboard stays usable.

- **Needs attention** lists unacknowledged alerts, newest first (the newest one is highlighted).
- **Acknowledge** or **Acknowledge all** moves alerts to the *Acknowledged* list; **Remove** deletes one.
- While alerts are unacknowledged you get a count badge on the bell, a red bar across the top of the screen, a floating *N unacknowledged alerts* button and the count in the browser tab title.
- <kbd>Esc</kbd> closes the panel.

| Screen width | Panel behaviour |
|---|---|
| Phones (< 560 px) | Full-screen sheet |
| Tablets and small laptops | Slides over the page with a dimmed backdrop |
| ≥ 1100 px | Floats beside the content without a backdrop |
| ≥ 1440 px | Docks beside the content; the dashboard reflows to make room |

Alerts in the panel live in memory for the current browser session; the server history (Events screen) is separate.

---

## How data flows

| Source | Endpoint | When |
|---|---|---|
| Live alerts | `WebSocket /ws` | Pushed by the server as soon as the desktop monitor reports fire or smoke. Reconnects automatically with backoff (1 s → 15 s) and shows a countdown. |
| History | `GET /api/events?limit=200` | On load, every 12 seconds, when the tab becomes visible again, and after each live alert. The server returns at most 200 of the 500 alerts it keeps. |
| Clear history | `POST /api/events/clear` | When you confirm **Clear history**. |

Server response time shown on the Health card is the duration of the last history request.

---

## Configuration

By default the app talks to the server on the **same origin** in production, and to port **8000 on the same host** during development. To point it elsewhere, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE` | `http://192.168.1.20:8000` | REST base URL |
| `VITE_WS_URL` | `ws://192.168.1.20:8000/ws` | WebSocket URL |

Variables are read at build time; rebuild after changing them.

---

## Installing on a phone or desktop

1. Open the dashboard served by the alert server (for example `http://<computer-ip>:8000` on your network; start the server with `--host 0.0.0.0`).
2. Use the browser's **Install app** (Chrome, Edge) or **Share → Add to Home Screen** (Safari on iOS).
3. Enable **System notifications** in Settings if you want alerts while the app is in the background.

> [!NOTE]
> Browsers only allow service workers, installation and notifications on `https://` or `localhost`. When opening the dashboard from another device over plain `http://`, live alerts and history still work, but install and notifications may be unavailable. Use a reverse proxy with TLS if you need them on other devices.

---

## Offline behaviour

The service worker (generated by vite-plugin-pwa with `registerType: 'autoUpdate'`) precaches the app shell and icons and caches the Google Fonts it uses. API and WebSocket requests always go to the network (`NetworkOnly`), so the dashboard never shows stale alerts as live; while offline it shows the reconnect banner instead.

---

## Project structure

```
web/
├── index.html                 # App shell, fonts, theme bootstrap, iOS PWA meta
├── vite.config.ts             # React + PWA plugin, manifest, runtime caching
├── public/                    # favicon.svg, PNG icons (32, 180, 192, 512, maskable)
└── src/
    ├── main.tsx               # Entry; registers the service worker
    ├── App.tsx                # Shell: navigation, screens, alert state, preferences
    ├── index.css              # Design tokens (light/dark), layout, components
    ├── lib/
    │   ├── api.ts             # API/WebSocket URLs, fetch helpers, hazard labels
    │   ├── stats.ts           # Time ranges, bucketing, totals
    │   ├── time.ts            # Relative times, clock and day labels
    │   ├── prefs.ts           # localStorage preferences and theme hook
    │   ├── feedback.ts        # Tone, vibration, system notifications
    │   └── alerts.ts          # Active alert type
    ├── hooks/
    │   ├── useAlertSocket.ts  # WebSocket with reconnect, uptime and reconnect count
    │   └── useEventLog.ts     # History polling, latency, refresh and clear
    ├── components/
    │   ├── Dashboard.tsx      # Status hero, KPI tiles, health card, range picker, events table
    │   ├── AlertPanel.tsx     # Side panel for hazard alerts
    │   ├── Navigation.tsx     # Sidebar (rail on tablets), phone top bar and tabs
    │   ├── charts/            # StackedColumns, Sparkline, SegmentedBar, useWidth
    │   └── …                  # Icons, BrandMark, StatusPill, Toggle, ConfirmButton
    └── screens/
        ├── OverviewScreen.tsx
        ├── EventsScreen.tsx
        └── SettingsScreen.tsx
```

---

## Design system

The dashboard shares its visual language with the project website: ivory / ink surfaces, an ember accent, Playfair Display headings, Inter body text, JetBrains Mono for figures, and dark "night" panels with an amber glow.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--s-fire` | `#d4622a` | `#e06d33` | Fire series in charts, fire icons |
| `--s-smoke` | `#3f76b5` | `#5a8bd0` | Smoke series in charts, smoke icons |
| `--good` / `--warning` / `--critical` | green / amber / red | lighter steps | Status only, always with an icon and label |

The two chart colours were checked for colour-vision-deficiency separation and contrast against the card surface in both themes. Status colours are reserved for state and never used as chart series.

Layouts: phones get a top bar and bottom tabs; tablets (≥ 720 px) an icon rail; desktops (≥ 1100 px) the full sidebar and a three-column grid. Safe-area insets are respected for notched phones.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Type-check and build to `dist/` (includes the service worker) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (TypeScript, React Hooks, React Refresh rules) |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| *Live channel disconnected* banner | Start `./run-pwa-server.sh`; check `curl http://127.0.0.1:8000/health` returns `{"status":"ok"}`. |
| Works on `:8000` but not in `npm run dev` | The dev server expects the API on port 8000 of the same host; set `VITE_API_BASE` / `VITE_WS_URL` otherwise. |
| No sound on the first alert | Browsers block audio until you interact with the page; click anywhere once. |
| System notifications toggle is disabled | Notifications are blocked or unsupported; allow them in the browser's site settings (requires `https://` or `localhost`). |
| Old version after an update | The service worker updates automatically; reload once, or clear site data. |
| Server's setup page instead of the dashboard | `web/dist` is missing; run `npm run build` and restart the server. |
