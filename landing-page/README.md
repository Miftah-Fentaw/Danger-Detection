# Danger Detection: website

The official site and documentation for [Danger Detection](https://github.com/Miftah-Fentaw/Danger-Detection), built with React, TypeScript and Vite.

## Develop

```bash
cd landing-page
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build locally
npm run lint
```

Requires Node.js 22.12 or newer.

Pages use hash routes (`#/docs/...`), so the build is a static `dist/` folder that works on any host without rewrite rules.

## Deploy to Vercel

The repository root contains `vercel.json`, which builds only this folder:

| Setting          | Value                              |
| ---------------- | ---------------------------------- |
| Install command  | `cd landing-page && npm ci`        |
| Build command    | `cd landing-page && npm run build` |
| Output directory | `landing-page/dist`                |

### From the dashboard

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repository.
2. Leave **Root Directory** as the repository root (`./`); `vercel.json` provides the commands.
3. Click **Deploy**. Every push to `main` deploys to production, and other branches get preview URLs.

### From the CLI

```bash
npm i -g vercel
vercel           # run from the repository root; creates a preview deployment
vercel --prod    # production deployment
```

`.vercelignore` keeps model weights, virtual environments and build folders out of CLI uploads.

### Custom domain

In the Vercel project, open **Settings → Domains**, add your domain, and create the DNS record Vercel shows (an `A` record for an apex domain or a `CNAME` for a subdomain).
