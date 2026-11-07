# Danger Detection — Website

The project website and documentation for [Danger Detection](https://github.com/Miftah-Fentaw/Danger-Detection): a marketing home page plus a full documentation section, built with React 19, TypeScript and Vite. Light and dark themes, no runtime dependencies besides React.

---

## Quick start

Requires **Node.js 22.12 or newer**.

```bash
cd landing-page
npm install
npm run dev        # http://localhost:5173
```

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and build the static site to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Oxlint |

---

## Pages

The site uses hash routes, so the build is a plain static folder that works on any host without rewrite rules.

| Route | Content |
|---|---|
| `#/` | Home: hero with install command, scroll-highlighted statement, features with a live detection console, animated *How it works* pipeline, use cases, quick start terminal, FAQ and call to action. |
| `#features`, `#how-it-works`, `#use-cases`, `#quick-start`, `#faq` | Sections of the home page. |
| `#/docs` | Documentation with a left sidebar, scroll-spy, reading progress and *Next* links. |
| `#/docs/<section>` | Deep link to a docs section, e.g. `#/docs/installation`, `#/docs/configuration`, `#/docs/api`. |

Other features: a centered pill navbar with a docs mega menu, an animated light/dark theme toggle (circular reveal via the View Transitions API where supported), a curtain transition between pages, and a ⌘K / Ctrl+K search palette that searches the full docs text.

---

## Editing content

| What | Where |
|---|---|
| Documentation sections | `src/docs/content.tsx` — each item has a `slug`, `title`, `summary` and JSX `body`. New items appear in the sidebar, docs menu and search automatically. |
| SEO title, description, keywords, FAQ | `src/seo.ts` — shared by the FAQ section and the build-time meta tags / JSON-LD. |
| Project links | `src/site.ts` |
| Home page sections | `src/components/` (`Hero`, `Statement`, `Features`, `HowItWorks`, `UseCases`, `QuickStart`, `Faq`, `Footer`) |
| Colours, typography, layout | `src/index.css` (tokens at the top; dark theme under `:root[data-theme='dark']`) |

---

## Project structure

```
landing-page/
├── index.html               # Meta tags (filled at build), theme bootstrap, noscript fallback
├── vite.config.ts           # React plugin + SEO plugin (meta, JSON-LD, robots.txt, sitemap.xml)
├── public/                  # favicon, app icons, og-image.png, site.webmanifest
└── src/
    ├── main.tsx
    ├── App.tsx              # Hash router + page curtain transition
    ├── router.ts            # parseHash / docHref
    ├── hooks.ts             # Reveal on scroll, count-up, scroll spy, scroll progress
    ├── meta.ts              # Per-page <title> and description
    ├── seo.ts               # Shared SEO copy and FAQ
    ├── site.ts              # Repository links
    ├── index.css            # Design tokens and all styles
    ├── docs/content.tsx     # Documentation content
    ├── pages/               # Home.tsx, Docs.tsx
    └── components/          # Navbar, ThemeToggle, Search, Hero, Features, HowItWorks, …
```

---

## SEO

Handled at build time by a small plugin in `vite.config.ts`:

- Title, description, keywords, canonical URL, Open Graph and Twitter card tags.
- JSON-LD structured data: `WebSite`, `SoftwareApplication`, `SoftwareSourceCode` and `FAQPage`.
- `robots.txt` and `sitemap.xml` generated into `dist/`.
- `site.webmanifest`, app icons and a 1200×630 `og-image.png` in `public/`.
- A `<noscript>` summary for crawlers that do not run JavaScript.

The public URL is resolved in this order:

1. `VITE_SITE_URL` (set it for a custom domain)
2. Vercel's production domain (`VERCEL_PROJECT_PRODUCTION_URL`, detected automatically)
3. `https://danger-detection.vercel.app`

```bash
VITE_SITE_URL=https://example.com npm run build
```

> Docs sections use hash routes, so search engines index them as part of the home page.

---

## Deploy to Vercel

The repository root contains `vercel.json`, which builds only this folder:

| Setting | Value |
|---|---|
| Install command | `cd landing-page && npm ci` |
| Build command | `cd landing-page && npm run build` |
| Output directory | `landing-page/dist` |

**Dashboard:** import the repository at [vercel.com/new](https://vercel.com/new), leave **Root Directory** as the repository root (`./`) and deploy. Pushes to `main` deploy to production; other branches get preview URLs.

**CLI:**

```bash
npm i -g vercel
vercel           # from the repository root; preview deployment
vercel --prod    # production deployment
```

`.vercelignore` keeps model weights, virtual environments and build folders out of CLI uploads. `vercel.json` also sets long-lived caching for hashed assets and standard security headers.

**Custom domain:** in the Vercel project open **Settings → Domains**, add the domain, create the DNS record Vercel shows, and set `VITE_SITE_URL` in **Settings → Environment Variables**.

---

## Other hosts

Any static host works: upload the contents of `dist/` after `npm run build`. No server-side routing is needed.
