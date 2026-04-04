#!/usr/bin/env bash
# Desktop Tkinter app: uses project venv (OpenCV, ultralytics, etc.).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${ROOT}"
exec "${ROOT}/venv/bin/python" -m danger_detection.app.main "$@"
