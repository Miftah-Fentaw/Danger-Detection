# Danger Detection

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

4. Build the web UI (optional but recommended):
```bash
cd web
npm install
npm run build
cd ..
```

## Running the Application

The system requires two components running simultaneously:

### Terminal 1 - API Server + Web PWA

```bash
source venv/bin/activate
export PYTHONPATH="${PWD}"
uvicorn danger_detection.app.pwa_server:app --host 127.0.0.1 --port 8000
```

### Terminal 2 - Desktop App

```bash
source venv/bin/activate
PYTHONPATH=. python -m danger_detection.app.main
```

### Access the PWA

Open **http://localhost:8000** in your browser.

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

The system uses YOLO models:

- **Fire/Smoke Detection**: Custom fine-tuned model (place at `danger_detection/models/`)
- **Person Detection**: COCO YOLOv8 model (auto-downloaded)

Place your custom fire/smoke model at:
```
danger_detection/models/fire_smoke.pt
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

MIT License - See LICENSE file for details.

## Acknowledgments

- [Ultralytics](https://ultralytics.com) - YOLO implementation
- [OpenCV](https://opencv.org) - Computer vision
- [FastAPI](https://fastapi.tiangolo.com) - Web framework
- [Vite PWA](https://vite-pwa.org) - PWA integration
