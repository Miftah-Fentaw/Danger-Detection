# Danger Detection

![FireGuard banner](docs/assets/fireguard-banner.png)

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                  ║
║     █████╗  ██████╗ ██████╗███████╗     ██████╗ ███████╗ ██████╗ ██████╗       ║
║    ██╔══██╗██╔════╝██╔════╝██╔════╝    ██╔═══██╗██╔════╝██╔════╝██╔══██╗      ║
║    ███████║██║     ██║     █████╗      ██║   ██║█████╗  ██║     ██████╔╝      ║
║    ██╔══██║██║     ██║     ██╔══╝      ██║   ██║██╔══╝  ██║     ██╔══██╗      ║
║    ██║  ██║╚██████╗╚██████╗███████╗    ╚██████╔╝██║     ╚██████╗██║  ██║      ║
║    ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚══════╝     ╚═════╝ ╚═╝      ╚═════╝╚═╝  ╚═╝      ║
║                                                                                  ║
║         🔥 Fire & Smoke Detection System with Real-Time Alerts 🔥                ║
║                                                                                  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

A real-time fire and smoke detection system with desktop monitoring and web-based alerts. Uses YOLO computer vision models for detection, with a Tkinter desktop UI and Progressive Web App (PWA) for remote monitoring.

![Python](https://img.shields.io/badge/python-3.10+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

Danger Detection is a security monitoring system that:

- **Detects fire and smoke** in real-time using YOLO object detection
- **Tracks persons** and identifies unusual movement patterns
- **Detects general objects** using COCO model
- **Sends alerts** via WebSocket to a web-based PWA
- **Logs events** to SQLite for later analysis

## Architecture

```
┌─────────────────────┐      ┌─────────────────────┐
│   Desktop App      │      │   Web PWA Server    │
│   (Tkinter UI)      │ ──▶  │   (FastAPI)         │
│                     │ HTTP │                     │
│  - Camera feed      │      │  - REST API         │
│  - Detection        │      │  - WebSocket        │
│  - Alert push       │      │  - PWA serving      │
└─────────────────────┘      └─────────────────────┘
                                    │
                                    ▼
                           ┌─────────────────────┐
                           │   Browser (PWA)     │
                           │                     │
                           │  - Live alerts       │
                           │  - Event history    │
                           │  - Installable      │
                           └─────────────────────┘
```

### Components

| Component | Technology | Description |
|-----------|------------|-------------|
| Desktop UI | Tkinter | Live camera feed with detection overlays |
| Detection Engine | YOLO (Ultralytics) | Fire, smoke, person, and object detection |
| Alert System | FastAPI + WebSocket | Real-time push notifications |
| PWA | React + Vite | Installable web interface |
| Database | SQLite | Event logging and history |

## Features

### Detection Capabilities

- **Fire Detection** - Identifies fire, flames, and burning objects
- **Smoke Detection** - Detects smoke and smoking materials
- **Person Tracking** - Tracks individuals with unusual movement detection
- **Object Detection** - General COCO object detection

### Alert System

- Real-time WebSocket push to connected browsers
- Desktop notifications
- Event history with timestamps
- Alert debouncing to prevent spam

### UI Features

- Dark-themed security monitor aesthetic
- Live camera preview with detection overlays
- Start/stop monitoring controls
- System status display
- Badge indicators (LIVE, STANDBY, ERROR)

## Installation

### Prerequisites

- **Python** 3.10 or newer
- **Node.js** 18+ (for building the web UI)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Miftah-Fentaw/Danger-Detection.git
cd Danger-Detection
```

2. Create and activate Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows
```

3. Install Python dependencies:
```bash
pip install --upgrade pip
pip install -r danger_detection/requirements.txt
```

4. Download the fire/smoke model. The application does not use an LLM; it uses
   an Ultralytics YOLO object-detection checkpoint. Download the `yolov8n.pt`
   weights from the
   [SHOU-ISD/fire-and-smoke model page](https://huggingface.co/SHOU-ISD/fire-and-smoke)
   and save them as:

```text
danger_detection/models/fire_smoke.pt
```

Create the directory if needed:

```bash
mkdir -p danger_detection/models
```

You can download the file from the model page's **Files and versions** tab,
or use the Hugging Face Python client:

```bash
pip install huggingface_hub
python - <<'PY'
from pathlib import Path
from huggingface_hub import hf_hub_download

source = hf_hub_download(
    repo_id="SHOU-ISD/fire-and-smoke",
    filename="yolov8n.pt",
)
target = Path("danger_detection/models/fire_smoke.pt")
target.write_bytes(Path(source).read_bytes())
print(f"Saved {target}")
PY
```

Verify that the checkpoint is valid and contains the expected classes:

```bash
python - <<'PY'
from ultralytics import YOLO

model = YOLO("danger_detection/models/fire_smoke.pt")
print(model.names)
PY
```

The output should contain `Fire` and `Smoke` (class IDs 0 and 1). Do not use
an arbitrary standard `yolov8n.pt` for fire detection: the COCO model does not
contain fire or smoke classes.

5. Build the web UI (optional when using the Vite development server):
```bash
cd web
npm install
npm run build
cd ..
```

## Running the Application

The system requires three processes when developing with the React/Vite server:

### Terminal 1 - React development server

```bash
cd web
npm run dev
```

### Terminal 2 - API server

```bash
./run-pwa-server.sh
```

### Terminal 3 - Camera and detection

```bash
./run-desktop.sh
```

Open the development PWA at **http://localhost:5173**. The React app connects
to the FastAPI service on port 8000.

For a production-style local run, build `web/` first and start only the API
server and desktop app:

```bash
./run-pwa-server.sh
./run-desktop.sh
```

Then open **http://localhost:8000**.

Check that the API is available before opening the PWA:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

If the browser shows “Unable to reach the alert service”, the API server is
not running on port 8000. Start `./run-pwa-server.sh` and refresh the page.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DANGER_DETECTION_NO_PWA_TIP` | - | Set to `1` to hide the PWA tip message |
| `DANGER_DETECTION_DB_PATH` | Auto | Path to SQLite database |
| `DANGER_DETECTION_SQLITE` | `1` | Enable/disable SQLite logging |
| `DANGER_DETECTION_LOG_OBJECTS` | `1` | Enable/disable object logging |
| `DANGER_DETECTION_LOG_OBJECTS_EVERY_N_FRAMES` | `1` | Log every N frames |
| `DANGER_DETECTION_ALERT_URL` | `http://127.0.0.1:8000/internal/alert` | Alert endpoint URL |
| `DANGER_DETECTION_ALERT_TOKEN` | - | Optional auth token for alerts |

## Running Only the Desktop App

If you don't need the web interface:

```bash
export PYTHONPATH="${PWD}"
python -m danger_detection.app.main
```

## Models

The system uses YOLO computer-vision models, not a language model:

- **Fire/smoke detection**: `danger_detection/models/fire_smoke.pt`, a
  fire-and-smoke checkpoint from
  [SHOU-ISD/fire-and-smoke](https://huggingface.co/SHOU-ISD/fire-and-smoke).
- **Person detection**: optional COCO YOLOv8 weights at
  `danger_detection/models/yolov8n.pt`. If they are not present, fire/smoke
  detection still works, but person tracking is unavailable.

The fire/smoke checkpoint must expose classes named `Fire` and `Smoke` (the
detector matches names case-insensitively). Model files are intentionally
ignored by Git because they are large; every fresh clone must download the
weights separately.

To use a model stored somewhere else:

```bash
export DANGER_DETECTION_MODEL=/absolute/path/to/model.pt
./run-desktop.sh
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve PWA static files |
| `/api/events` | GET | Get event history |
| `/ws` | WebSocket | Real-time alert stream |
| `/internal/alert` | POST | Internal alert endpoint |

## Project Structure

```
Danger-Detection/
├── app/                      # Legacy desktop app
│   ├── main.py
│   ├── models/
│   │   └── detector.py
│   └── utils/
├── danger_detection/        # Main application
│   ├── app/
│   │   ├── main.py          # Desktop app entry
│   │   ├── detector.py      # YOLO detection engine
│   │   ├── alert_notify.py  # Alert forwarding
│   │   ├── pwa_server.py    # FastAPI server
│   │   └── sqlite_store.py  # Database storage
│   ├── models/              # YOLO model weights
│   └── requirements.txt
├── web/                      # React PWA
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── run-desktop.sh           # Desktop runner script
├── run-pwa-server.sh        # Server runner script
└── README.md
```

## Troubleshooting

### Camera Not Opening

Ensure your webcam is connected and not in use by another application.

### Model Not Found

Place your YOLO model at `danger_detection/models/fire_smoke.pt`. Without it, the app will show an error.

### Push Rejected (Large Files)

If GitHub rejects large files, use Git LFS or remove large files from history:
```bash
git filter-repo --path path/to/large/file --invert-paths --force
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ultralytics](https://ultralytics.com) - YOLO implementation
- [OpenCV](https://opencv.org) - Computer vision
- [FastAPI](https://fastapi.tiangolo.com) - Web framework
- [Vite PWA](https://vite-pwa.org) - PWA integration
