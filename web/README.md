# Danger Detection Web PWA

This directory contains the React + Vite citizen-facing alert dashboard. It
does not run YOLO inference and it does not access the camera. The Python
FastAPI service provides the REST API and WebSocket connection used by this
frontend.

## Requirements

- Node.js 18 or newer
- npm
- The Python API running on port 8000 for live data

Install dependencies:

```bash
npm install
```

## Development

Start the Vite development server:

```bash
npm run dev
```

Open `http://localhost:5173`. In development, the frontend uses:

- REST: `http://localhost:8000/api/events`
- WebSocket: `ws://localhost:8000/ws`

Start the API separately from the repository root:

```bash
./run-pwa-server.sh
```

The desktop detector is a third process when live camera alerts are required:

```bash
./run-desktop.sh
```

## Production build

Build the static files:

```bash
npm run build
```

The output is written to `dist/`. The FastAPI server serves `web/dist/` at
`http://localhost:8000` when the directory exists.

Other useful commands:

```bash
npm run lint
npm run preview
```

## Configuration

Copy `.env.example` to `.env.local` when the development API is not at the
default address:

```bash
cp .env.example .env.local
```

Available Vite variables:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE` | REST API base, such as `http://127.0.0.1:8000` |
| `VITE_WS_URL` | WebSocket URL, such as `ws://127.0.0.1:8000/ws` |

The production build uses the same origin for API and WebSocket requests.

## Dashboard behavior

- **Alerts:** loads recent events and subscribes to live WebSocket alerts.
- **Settings:** stores sound and vibration preferences in browser
  `localStorage`.
- **Clear list:** sends `POST /api/events/clear`.

If the page displays “Unable to reach the alert service”, verify that the
FastAPI process is running and that `curl http://127.0.0.1:8000/health` returns
`{"status":"ok"}`.
