/* eslint-disable react/jsx-key -- table cells in static data; Table assigns keys when rendering */
import type { ReactNode } from 'react'
import { Callout, CodeBlock, Table } from '../components/DocBits'
import { GITHUB_URL, ISSUES_URL, LICENSE_URL } from '../site'

export type DocItem = { slug: string; title: string; summary: string; body: ReactNode }
export type DocGroup = { title: string; items: DocItem[] }

export const DOC_GROUPS: DocGroup[] = [
  {
    title: 'Getting started',
    items: [
      {
        slug: 'introduction',
        title: 'Introduction',
        summary: 'What Danger Detection is and what it does.',
        body: (
          <>
            <p>
              Danger Detection is an open-source, real-time fire and smoke detection system. It reads
              a camera feed, runs YOLO computer-vision models on every frame, and pushes alerts to a
              Progressive Web App (PWA) that any phone or laptop on your network can open.
            </p>
            <p>Out of the box it can:</p>
            <ul>
              <li>
                <strong>Detect fire and smoke</strong> with a fine-tuned YOLO model.
              </li>
              <li>
                <strong>Track people</strong> across frames and flag unusual, fast movement.
              </li>
              <li>
                <strong>Detect general objects</strong> using a COCO YOLOv8 model.
              </li>
              <li>
                <strong>Send alerts</strong> over WebSocket to every connected browser.
              </li>
              <li>
                <strong>Log events</strong> to SQLite for later analysis.
              </li>
            </ul>
            <Callout type="tip">
              Everything runs locally. Video never leaves your machine, and only fire and smoke
              counts are sent to the alert server.
            </Callout>
          </>
        ),
      },
      {
        slug: 'requirements',
        title: 'Requirements',
        summary: 'Python, Node.js, a camera and model weights.',
        body: (
          <>
            <Table
              head={['Requirement', 'Version', 'Why']}
              rows={[
                ['Python', '3.10 or newer', 'Desktop app, detection engine and API server'],
                ['Node.js', '18 or newer', 'Building the web PWA'],
                ['Webcam', 'Any OpenCV-compatible camera', 'Video input (camera index 0 by default)'],
                [<code>fire_smoke.pt</code>, 'YOLO weights', 'Fine-tuned fire and smoke model'],
              ]}
            />
            <p>Python dependencies are listed in <code>danger_detection/requirements.txt</code>:</p>
            <CodeBlock
              lang="text"
              title="requirements.txt"
              code={`opencv-python>=4.8.0
ultralytics>=8.0.0
pillow>=10.0.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0`}
            />
          </>
        ),
      },
      {
        slug: 'installation',
        title: 'Installation',
        summary: 'Clone, create a virtual environment, install dependencies.',
        body: (
          <>
            <h3>1. Clone the repository</h3>
            <CodeBlock code={`git clone ${GITHUB_URL}.git\ncd Danger-Detection`} />
            <h3>2. Create a virtual environment</h3>
            <CodeBlock
              code={`python3 -m venv venv
source venv/bin/activate      # Linux / macOS
# venv\\Scripts\\activate       # Windows`}
            />
            <h3>3. Install Python dependencies</h3>
            <CodeBlock code={`pip install --upgrade pip\npip install -r danger_detection/requirements.txt`} />
            <h3>4. Download the model</h3>
            <p>
              Save the fire and smoke checkpoint (<code>yolov8n.pt</code> from the{' '}
              <a href="https://huggingface.co/SHOU-ISD/fire-and-smoke" target="_blank" rel="noreferrer">
                SHOU-ISD/fire-and-smoke
              </a>{' '}
              model page) as <code>danger_detection/models/fire_smoke.pt</code>:
            </p>
            <CodeBlock
              code={`pip install huggingface_hub
python - <<'PY'
from pathlib import Path
from huggingface_hub import hf_hub_download

source = hf_hub_download(repo_id="SHOU-ISD/fire-and-smoke", filename="yolov8n.pt")
target = Path("danger_detection/models/fire_smoke.pt")
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(Path(source).read_bytes())
PY`}
            />
            <h3>5. Build the web app</h3>
            <p>
              Optional but recommended. The API server serves the built PWA from{' '}
              <code>web/dist</code> at <code>http://localhost:8000</code>.
            </p>
            <CodeBlock code={`cd web\nnpm install\nnpm run build\ncd ..`} />
            <Callout>
              If <code>web/dist</code> does not exist, the server shows a short help page at{' '}
              <code>/</code> with these build steps instead of the PWA.
            </Callout>
          </>
        ),
      },
      {
        slug: 'running',
        title: 'Running the system',
        summary: 'Start the alert server, then the desktop detector.',
        body: (
          <>
            <p>The system runs as two processes, one per terminal.</p>
            <h3>Terminal 1: API server and PWA</h3>
            <CodeBlock
              code={`source venv/bin/activate
export PYTHONPATH="\${PWD}"
uvicorn danger_detection.app.pwa_server:app --host 127.0.0.1 --port 8000`}
            />
            <h3>Terminal 2: desktop app</h3>
            <CodeBlock code={`source venv/bin/activate\nPYTHONPATH=. python -m danger_detection.app.main`} />
            <p>
              Click <strong>Start monitoring</strong> in the desktop window. The status badge switches
              from <code>STANDBY</code> to <code>LIVE</code> and detections are drawn on the preview.
            </p>
            <h3>Open the PWA</h3>
            <p>
              Go to <code>http://localhost:8000</code>. Your browser can install it as an app, and it
              receives alerts as soon as the desktop detector sees fire or smoke.
            </p>
            <h3>Helper scripts</h3>
            <p>Both scripts use the project&apos;s <code>venv</code> and set <code>PYTHONPATH</code> for you:</p>
            <CodeBlock code={`./run-pwa-server.sh   # API server on 127.0.0.1:8000\n./run-desktop.sh      # Tkinter desktop app`} />
            <Callout type="tip">
              Only need local monitoring? Run the desktop app on its own. Alerts that cannot reach
              the server are dropped silently.
            </Callout>
          </>
        ),
      },
    ],
  },
  {
    title: 'Concepts',
    items: [
      {
        slug: 'architecture',
        title: 'Architecture',
        summary: 'How the desktop app, server and PWA fit together.',
        body: (
          <>
            <CodeBlock
              lang="text"
              title="overview"
              code={`┌──────────────────┐   HTTP POST    ┌──────────────────┐   WebSocket   ┌──────────────┐
│  Desktop app     │ ─────────────▶ │  Alert server    │ ────────────▶ │  Web PWA     │
│  Tkinter + YOLO  │ /internal/alert│  FastAPI         │      /ws      │  React       │
└──────────────────┘                └──────────────────┘               └──────────────┘
        │                                    │
        ▼                                    ▼
   SQLite log                        in-memory event log  ◀── GET /api/events`}
            />
            <Table
              head={['Component', 'Technology', 'Role']}
              rows={[
                ['Desktop UI', 'Tkinter', 'Live camera preview with detection overlays'],
                ['Detection engine', 'Ultralytics YOLO + OpenCV', 'Fire, smoke, person and object detection'],
                ['Alert server', 'FastAPI + WebSocket', 'Receives alerts and fans them out to clients'],
                ['PWA', 'React + Vite', 'Installable web interface for live alerts and history'],
                ['Database', 'SQLite', 'Detection and app-flow audit log'],
              ]}
            />
            <p>
              The desktop app and the server are separate processes. The desktop app owns the camera
              and forwards alerts over HTTP, so the server can run on the same machine or anywhere on
              your network.
            </p>
          </>
        ),
      },
      {
        slug: 'detection',
        title: 'Detection pipeline',
        summary: 'Frames, YOLO inference, thresholds and class mapping.',
        body: (
          <>
            <p>
              <code>FireSmokeDetector</code> captures frames from the webcam and runs YOLO inference
              on a worker thread. Annotated frames are handed to the Tkinter main thread through a
              single-slot queue, so the preview always shows the latest frame.
            </p>
            <h3>Confidence threshold</h3>
            <p>
              Boxes below a confidence of <code>0.35</code> are ignored. Lower it to catch more
              (with more false positives); raise it to be stricter.
            </p>
            <h3>Class mapping</h3>
            <p>
              Datasets name their classes differently, so labels are normalised and matched by name:
            </p>
            <Table
              head={['Model label contains', 'Mapped to']}
              rows={[
                [<><code>fire</code>, <code>flame</code>, <code>burning</code></>, 'fire'],
                [<><code>smoke</code>, <code>smoking</code></>, 'smoke'],
                [<code>fire hydrant</code>, 'ignored (COCO class)'],
              ]}
            />
            <h3>Overlay colours</h3>
            <ul>
              <li>Fire: orange-red boxes</li>
              <li>Smoke: grey boxes</li>
              <li>Person: green, or red when movement is unusual</li>
              <li>General objects: light cyan (up to 30 boxes per frame)</li>
            </ul>
          </>
        ),
      },
      {
        slug: 'person-tracking',
        title: 'Person tracking',
        summary: 'How unusual movement is flagged.',
        body: (
          <>
            <p>
              People are detected with the COCO model (class 0) and tracked across frames by
              <code> PersonMovementTracker</code>. Each detection is matched to a previous track by
              box overlap (IoU ≥ 0.25) or, failing that, by centre distance (≤ 150 px).
            </p>
            <Table
              head={['Rule', 'Value']}
              rows={[
                ['Movement counted as fast', 'more than 50 px between frames'],
                ['Jumps ignored (likely a mismatch)', 'more than 300 px'],
                ['Frames of fast movement to flag', '3 in a row'],
              ]}
            />
            <p>
              A flagged person is drawn in red on the desktop preview. Person tracking is shown
              locally only; it does not trigger PWA alerts.
            </p>
          </>
        ),
      },
      {
        slug: 'alerts',
        title: 'Alerts & WebSocket',
        summary: 'How an alert travels from the camera to your phone.',
        body: (
          <>
            <ol>
              <li>The detector counts fire and smoke boxes in a frame.</li>
              <li>
                Alerts are debounced (at most one every 0.45 s) and posted in the background to{' '}
                <code>DANGER_DETECTION_ALERT_URL</code>.
              </li>
              <li>The server records the event and queues it for broadcast.</li>
              <li>Every WebSocket client on <code>/ws</code> receives the payload within ~50 ms.</li>
            </ol>
            <CodeBlock
              lang="json"
              title="POST /internal/alert"
              code={`{ "fire": 1, "smoke": 2 }`}
            />
            <CodeBlock
              lang="json"
              title="WebSocket message"
              code={`{ "type": "alert", "fire": 1, "smoke": 2, "ts": 1731000000.12, "source": "desktop_app" }`}
            />
            <p>
              On connect, clients first receive a <code>{`{"type": "hello"}`}</code> message.
              Clients only listen; the socket does not accept commands.
            </p>
            <Callout type="warn">
              To stop other devices on your network from posting fake alerts, set the same{' '}
              <code>DANGER_DETECTION_ALERT_TOKEN</code> for both processes. The desktop app then sends
              it as an <code>X-Alert-Token</code> header and the server rejects anything else with
              403.
            </Callout>
          </>
        ),
      },
      {
        slug: 'logging',
        title: 'Event logging',
        summary: 'What is stored in SQLite and in memory.',
        body: (
          <>
            <p>
              The desktop detector writes to a SQLite database at{' '}
              <code>danger_detection/data/danger_detection.db</code> (override with{' '}
              <code>DANGER_DETECTION_DB_PATH</code>). Writes happen on a background thread.
            </p>
            <Table
              head={['Table', 'Contents']}
              rows={[
                [<code>object_detections</code>, 'session, frame index, model, class, confidence and bounding box'],
                [<code>app_flow_events</code>, 'session events such as start and stop, with JSON metadata'],
              ]}
            />
            <p>
              The server separately keeps the last 500 alerts in memory. The PWA reads them from{' '}
              <code>GET /api/events</code> to show history next to live alerts; they reset when the
              server restarts.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      {
        slug: 'configuration',
        title: 'Configuration',
        summary: 'Environment variables.',
        body: (
          <>
            <Table
              head={['Variable', 'Default', 'Description']}
              rows={[
                [<code>DANGER_DETECTION_MODEL</code>, 'auto', 'Path to fire/smoke weights; overrides the search order'],
                [<code>DANGER_DETECTION_ALERT_URL</code>, <code>http://127.0.0.1:8000/internal/alert</code>, 'Where the desktop app posts alerts. Empty or 0 disables forwarding'],
                [<code>DANGER_DETECTION_ALERT_TOKEN</code>, 'none', 'Shared secret checked by the server'],
                [<code>DANGER_DETECTION_DB_PATH</code>, 'auto', 'Path to the SQLite database'],
                [<code>DANGER_DETECTION_SQLITE</code>, <code>1</code>, 'Enable or disable SQLite logging'],
                [<code>DANGER_DETECTION_LOG_OBJECTS</code>, <code>1</code>, 'Log every detected object'],
                [<code>DANGER_DETECTION_LOG_OBJECTS_EVERY_N_FRAMES</code>, <code>1</code>, 'Only log objects every N frames'],
                [<code>DANGER_DETECTION_PWA_AUTO_START</code>, <code>0</code>, 'Let the server open the camera itself'],
                [<code>DANGER_DETECTION_NO_PWA_TIP</code>, 'unset', 'Set to 1 to hide the PWA tip on desktop start'],
              ]}
            />
            <CodeBlock
              title="example"
              code={`export DANGER_DETECTION_ALERT_TOKEN="change-me"
export DANGER_DETECTION_LOG_OBJECTS_EVERY_N_FRAMES=10
./run-pwa-server.sh`}
            />
          </>
        ),
      },
      {
        slug: 'api',
        title: 'API reference',
        summary: 'HTTP and WebSocket endpoints.',
        body: (
          <>
            <Table
              head={['Method', 'Path', 'Description']}
              rows={[
                ['GET', <code>/</code>, 'Serves the built PWA (or a setup page)'],
                ['GET', <code>/health</code>, 'Health check'],
                ['GET', <code>/api/events?limit=50</code>, 'Recent alerts, newest first (limit 1–200)'],
                ['DELETE', <code>/api/events</code>, 'Clear the in-memory event log'],
                ['POST', <code>/api/events/clear</code>, 'Same as above, for clients without DELETE'],
                ['POST', <code>/internal/alert</code>, 'Ingest an alert from the desktop app'],
                ['WS', <code>/ws</code>, 'Live alert stream'],
              ]}
            />
            <CodeBlock
              lang="json"
              title="GET /api/events"
              code={`{
  "events": [
    {
      "ts": 1731000000.12,
      "iso": "2026-11-07T14:00:00.120000Z",
      "fire": 1,
      "smoke": 0,
      "source": "desktop_app",
      "summary": "fire ×1"
    }
  ]
}`}
            />
            <CodeBlock
              title="try it"
              code={`curl -X POST http://127.0.0.1:8000/internal/alert \\
  -H "Content-Type: application/json" \\
  -d '{"fire": 1, "smoke": 0}'`}
            />
          </>
        ),
      },
      {
        slug: 'models',
        title: 'Model weights',
        summary: 'Which YOLO weights are loaded and from where.',
        body: (
          <>
            <p>The fire and smoke model is chosen in this order:</p>
            <ol>
              <li>
                <code>DANGER_DETECTION_MODEL</code>, if set
              </li>
              <li>
                <code>app/models/fire_smoke.pt</code>
              </li>
              <li>
                <code>danger_detection/models/fire_smoke.pt</code>
              </li>
              <li>
                <code>app/models/yolov8n.pt</code>, or the first <code>*.pt</code> in{' '}
                <code>app/models/</code>
              </li>
              <li>
                <code>danger_detection/models/yolov8n.pt</code>
              </li>
            </ol>
            <Callout type="warn">
              The COCO <code>yolov8n.pt</code> model has no fire or smoke classes. Use a fine-tuned{' '}
              <code>fire_smoke.pt</code> for real hazard detection.
            </Callout>
            <p>
              Person and object detection always use COCO YOLOv8n at{' '}
              <code>danger_detection/models/yolov8n.pt</code>. They are optional: without that file, fire and
              smoke detection still work but person tracking and object labels are off.
            </p>
          </>
        ),
      },
      {
        slug: 'structure',
        title: 'Project structure',
        summary: 'Where everything lives in the repository.',
        body: (
          <CodeBlock
            lang="text"
            title="Danger-Detection/"
            code={`app/                      legacy desktop app
danger_detection/
  app/
    main.py               desktop app entry (Tkinter)
    detector.py           YOLO detection engine and person tracker
    alert_notify.py       forwards alerts to the server
    pwa_server.py         FastAPI server, REST + WebSocket
    alert_log.py          in-memory event log
    sqlite_store.py       SQLite writer
    utils.py              model and database paths
  models/                 YOLO weights (fire_smoke.pt, yolov8n.pt)
  requirements.txt
web/                      React PWA (Vite)
landing-page/             this website
run-desktop.sh
run-pwa-server.sh`}
          />
        ),
      },
    ],
  },
  {
    title: 'Help',
    items: [
      {
        slug: 'troubleshooting',
        title: 'Troubleshooting',
        summary: 'Common problems and fixes.',
        body: (
          <>
            <h3>The camera does not open</h3>
            <p>Make sure the webcam is connected and not in use by another app (video calls, other monitors).</p>
            <h3>Model not found</h3>
            <p>
              Place your weights at <code>danger_detection/models/fire_smoke.pt</code>, or point{' '}
              <code>DANGER_DETECTION_MODEL</code> at them.
            </p>
            <h3>No alerts in the PWA</h3>
            <ul>
              <li>Check the server is running and <code>/health</code> responds.</li>
              <li>
                Confirm <code>DANGER_DETECTION_ALERT_URL</code> points at the server.
              </li>
              <li>If you set a token, it must match on both processes.</li>
            </ul>
            <h3>GitHub rejects the push (large files)</h3>
            <p>Use Git LFS for weights, or remove large files from history:</p>
            <CodeBlock code={`git filter-repo --path path/to/large/file --invert-paths --force`} />
          </>
        ),
      },
      {
        slug: 'roadmap',
        title: 'Roadmap',
        summary: 'What is planned next.',
        body: (
          <>
            <p>The detector already defines interfaces for two upcoming features:</p>
            <ul>
              <li>
                <strong>Weapon detection</strong> (<code>WeaponDetector</code>): needs dedicated
                weights and a class map.
              </li>
              <li>
                <strong>Abnormal behaviour analysis</strong> (<code>AbnormalBehaviorDetector</code>):
                unusual-activity detection beyond movement speed.
              </li>
            </ul>
            <p>
              Ideas and pull requests are welcome on{' '}
              <a href={ISSUES_URL} target="_blank" rel="noreferrer">
                GitHub issues
              </a>
              .
            </p>
          </>
        ),
      },
      {
        slug: 'license',
        title: 'Contributing & license',
        summary: 'How to help, and the MIT license.',
        body: (
          <>
            <p>
              Fork the{' '}
              <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                repository
              </a>
              , create a branch, and open a pull request. Bug reports with steps to reproduce are
              just as valuable.
            </p>
            <p>
              Danger Detection is released under the{' '}
              <a href={LICENSE_URL} target="_blank" rel="noreferrer">
                MIT License
              </a>
              . It builds on Ultralytics YOLO, OpenCV, FastAPI and Vite PWA.
            </p>
          </>
        ),
      },
    ],
  },
]

export const DOC_ITEMS = DOC_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })))
