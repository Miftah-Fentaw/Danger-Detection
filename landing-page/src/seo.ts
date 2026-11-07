/**
 * Shared SEO copy. Used by the app (FAQ section, page titles) and by
 * vite.config.ts (meta tags, JSON-LD, robots.txt, sitemap.xml) so they never drift.
 * Keep this file free of browser or React APIs.
 */

export const SITE_NAME = 'Danger Detection'
export const REPO_URL = 'https://github.com/Miftah-Fentaw/Danger-Detection'
export const AUTHOR = 'Miftah Fentaw'

export const TITLE = 'Danger Detection: AI-Powered Real-Time Fire & Smoke Detection (Open Source)'

export const DESCRIPTION =
  'Danger Detection is a free, open-source, AI-powered fire and smoke detection system. YOLO computer vision watches any webcam in real time, tracks people, and sends instant alerts to your phone through an installable web app. Runs 100% locally.'

export const SHORT_DESCRIPTION =
  'AI-powered fire and smoke detection for any camera. Real-time YOLO vision, instant phone alerts, runs locally. Free and open source.'

export const KEYWORDS = [
  'AI fire detection',
  'smoke detection',
  'fire and smoke detection',
  'computer vision',
  'YOLO',
  'YOLOv8',
  'Ultralytics',
  'real-time object detection',
  'webcam fire detection',
  'CCTV fire detection',
  'AI security camera',
  'hazard detection',
  'person tracking',
  'open source',
  'Python',
  'OpenCV',
  'FastAPI',
  'WebSocket alerts',
  'PWA',
  'home safety',
  'warehouse safety',
]

export type Faq = { q: string; a: string }

export const FAQ: Faq[] = [
  {
    q: 'What is Danger Detection?',
    a: 'Danger Detection is an open-source, AI-powered system that watches a camera feed and detects fire and smoke in real time using YOLO computer vision. When it sees a hazard it sends an instant alert to every phone or browser connected to its web app.',
  },
  {
    q: 'Is Danger Detection free?',
    a: 'Yes. It is free and open source under the MIT License. You can use it, modify it and run it commercially.',
  },
  {
    q: 'Does my video leave my computer?',
    a: 'No. Detection runs entirely on your own machine. Only fire and smoke counts are sent to the alert server, which you also run yourself.',
  },
  {
    q: 'What do I need to run it?',
    a: 'Python 3.10 or newer, any OpenCV-compatible webcam, and fire and smoke model weights (fire_smoke.pt). Node.js 18+ is needed to build the web app. It runs on a CPU; a CUDA GPU makes inference faster.',
  },
  {
    q: 'Can I use my own YOLO model?',
    a: 'Yes. Point the DANGER_DETECTION_MODEL environment variable at any Ultralytics YOLO weights file. Classes named fire, flame, burning, smoke or smoking are recognised automatically.',
  },
  {
    q: 'How do I get alerts on my phone?',
    a: 'Open the web app served by the alert server (http://localhost:8000 by default, or the server address on your network) and install it as a PWA. Alerts arrive over WebSocket as soon as the detector sees fire or smoke.',
  },
  {
    q: 'Does it replace a smoke alarm?',
    a: 'No. Danger Detection is an extra layer of awareness, not a certified fire alarm. Always keep tested smoke alarms installed and follow local fire-safety regulations.',
  },
]

export const DOCS_TITLE = (section?: string) =>
  section ? `${section} · Docs · ${SITE_NAME}` : `Documentation · ${SITE_NAME}`
