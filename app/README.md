# Legacy Desktop Prototype

This directory contains the original desktop prototype. It is kept for
reference and is not the active runtime used by the current web-connected
application.

## Contents

- `main.py` contains the legacy application entry point.
- `utils/camera.py` contains the original camera helper.
- `models/detector.py` is an empty placeholder in the current repository.

The maintained implementation is under [`danger_detection/app`](../danger_detection/app).
Use the root runner scripts instead:

```bash
./run-pwa-server.sh
./run-desktop.sh
```

The current detector, model loading, alert forwarding, FastAPI service, and
SQLite logging are all implemented in the `danger_detection` package. Changes
to this legacy directory do not automatically affect the production desktop
application.
