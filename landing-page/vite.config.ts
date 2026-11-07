import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { AUTHOR, DESCRIPTION, FAQ, KEYWORDS, REPO_URL, SHORT_DESCRIPTION, SITE_NAME, TITLE } from './src/seo.ts'

/**
 * Public URL of the site, used for canonical links, Open Graph and the sitemap.
 * Order: VITE_SITE_URL, then Vercel's production domain, then a fallback.
 */
function resolveSiteUrl(env: Record<string, string>) {
  const raw =
    env.VITE_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'https://danger-detection.vercel.app'
  return raw.replace(/\/+$/, '')
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function jsonLd(site: string) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: SITE_NAME,
        description: SHORT_DESCRIPTION,
        inLanguage: 'en',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${site}/#app`,
        name: SITE_NAME,
        description: DESCRIPTION,
        url: `${site}/`,
        image: `${site}/og-image.png`,
        applicationCategory: 'SecurityApplication',
        applicationSubCategory: 'AI fire and smoke detection',
        operatingSystem: 'Windows, macOS, Linux',
        softwareRequirements: 'Python 3.10+, webcam',
        isAccessibleForFree: true,
        license: 'https://opensource.org/licenses/MIT',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          'AI-powered real-time fire detection',
          'Smoke detection',
          'Person tracking with unusual-movement flags',
          'COCO object detection',
          'Instant WebSocket alerts to an installable PWA',
          'SQLite event logging',
          'Runs fully offline on local hardware',
        ],
        keywords: KEYWORDS.join(', '),
        author: { '@type': 'Person', name: AUTHOR, url: 'https://github.com/Miftah-Fentaw' },
        sameAs: [REPO_URL],
      },
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${site}/#source`,
        name: SITE_NAME,
        codeRepository: REPO_URL,
        programmingLanguage: ['Python', 'TypeScript'],
        runtimePlatform: 'Python 3.10+',
        license: 'https://opensource.org/licenses/MIT',
        targetProduct: { '@id': `${site}/#app` },
      },
      {
        '@type': 'FAQPage',
        '@id': `${site}/#faq`,
        mainEntity: FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}

function seo(site: string): Plugin {
  return {
    name: 'danger-detection-seo',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html
        .replaceAll('%SITE_URL%', site)
        .replaceAll('%SEO_TITLE%', esc(TITLE))
        .replaceAll('%SEO_DESCRIPTION%', esc(DESCRIPTION))
        .replaceAll('%SEO_SHORT_DESCRIPTION%', esc(SHORT_DESCRIPTION))
        .replaceAll('%SEO_KEYWORDS%', esc(KEYWORDS.join(', ')))
        .replaceAll('%SEO_AUTHOR%', esc(AUTHOR))
          .replace('<!--SEO_JSONLD-->', `<script type="application/ld+json">${jsonLd(site)}</script>`),
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), seo(resolveSiteUrl(env))],
  }
})
