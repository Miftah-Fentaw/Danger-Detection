# Danger Detection Python Runtime

This package contains the production Python runtime for Danger Detection:

- `app/detector.py` runs YOLO inference against a webcam.
- `app/main.py` provides the Tkinter desktop monitor.
- `app/pwa_server.py` provides the FastAPI REST and WebSocket API.
- `app/alert_notify.py` forwards desktop detections to the API.
- `app/sqlite_store.py` stores detection and flow events.

The package is used from the repository root. See the root [README](../README.md)
for the complete system setup.

## Requirements

- Python 3.10 or newer
- A working camera
- Tkinter for the desktop UI
- Dependencies from [`requirements.txt`](requirements.txt)
- A YOLO fire/smoke checkpoint at `models/fire_smoke.pt`

Install the runtime:

```bash
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
```

The fire/smoke checkpoint is not an LLM. It must be an Ultralytics YOLO
detection model whose class names include `Fire` and `Smoke`. The recommended
source and validation command are documented in the root README.

## Running

From the repository root:

```bash
./run-pwa-server.sh
```

In another terminal:

```bash
./run-desktop.sh
```

The API listens on `http://127.0.0.1:8000`. Check it with:

```bash
curl http://127.0.0.1:8000/health
```

The API does not start the camera unless
`DANGER_DETECTION_PWA_AUTO_START=1` is set. Normally the desktop process owns
the camera and forwards alerts to the API over HTTP.

## Model paths

Model resolution is handled by `app/utils.py` in this order:

1. `DANGER_DETECTION_MODEL`, when set.
2. `app/models/fire_smoke.pt`.
3. `models/fire_smoke.pt`.
4. A fallback `.pt` file in `app/models/`.
5. `models/yolov8n.pt`.

Use a custom model without moving it:

```bash
export DANGER_DETECTION_MODEL=/absolute/path/to/model.pt
./run-desktop.sh
```

An optional COCO YOLO model at `models/yolov8n.pt` enables person and general
object detection. Fire/smoke detection still works without that optional file.

## API contract

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Service health check |
| `/api/events` | GET | Return recent alert history |
| `/api/events/clear` | POST | Clear in-memory alert history |
| `/internal/alert` | POST | Receive desktop alert counts |
| `/ws` | WebSocket | Stream live alerts to clients |

An alert payload sent to `/internal/alert` has this shape:

```json
{"fire": 1, "smoke": 0}
```

Set `DANGER_DETECTION_ALERT_TOKEN` on both the desktop process and API process
to require the `X-Alert-Token` header for internal alert ingestion.

## Troubleshooting

- **Model not found:** confirm `models/fire_smoke.pt` exists and run the
  validation command from the root README.
- **Invalid checkpoint:** re-download the complete `.pt` file; a partial file
  cannot be loaded by Ultralytics.
- **Camera unavailable:** check camera permissions and that no other process is
  using the device.
- **PWA cannot connect:** start the API on port 8000 before opening the web UI.
- **Tkinter missing:** install the platform package, for example
  `sudo apt install python3-tk` on Debian or Ubuntu.
