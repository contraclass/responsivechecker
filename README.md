# Responsive Checker

Screenshot any URL across mobile, tablet, laptop, and desktop sizes, on multiple browser engines.

## Devices covered

**Mobile**: iPhone SE, iPhone 14 Pro, iPhone 15 Pro Max, Pixel 8, Galaxy S24, Galaxy Z Fold
**Tablet**: iPad mini, iPad Pro 11", Galaxy Tab S9
**Laptop**: Surface Laptop, MacBook Air 13", MacBook Pro 14"
**Desktop**: Windows 1080p, 1440p, 4K

## Browser engines

- **Chromium** — covers Chrome, Edge, Opera, Brave, Samsung Internet, Android Chrome (free tier)
- **Firefox** — Gecko engine (requires paid provider)
- **WebKit** — Safari iOS + macOS (requires paid provider)

## Providers

Two screenshot providers are supported. Swap via `SCREENSHOT_PROVIDER` env var.

### Microlink (default, free)
- Free tier: ~50 screenshots/day per IP
- Chromium engine only
- No setup required
- Optional: set `MICROLINK_API_KEY` for higher limits

### ScreenshotOne (paid, full engine support)
- ~$10/mo for thousands of screenshots
- Supports Chromium, Firefox, and WebKit
- Uses HMAC-SHA256 signed URLs — secret key stays server-side
- Sign up at https://screenshotone.com → grab access key AND secret key
- Set env vars:
  - `SCREENSHOT_PROVIDER=screenshotone`
  - `SCREENSHOTONE_ACCESS_KEY=your_access_key`
  - `SCREENSHOTONE_SECRET_KEY=your_secret_key`

## Local dev

```bash
npm install -g netlify-cli
netlify dev
```

Open http://localhost:8888.

## Deploy

1. Push this repo to GitHub
2. In Netlify: Add new site → Import existing project → pick the repo
3. Build command: (leave blank)
4. Publish directory: `.`
5. Functions directory: `netlify/functions` (auto-detected from `netlify.toml`)
6. (Optional) Add env vars under Site settings → Environment variables

## Architecture

- Static frontend (`index.html`, `style.css`, `script.js`, `devices.js`)
- Single Netlify Function (`netlify/functions/screenshot.js`) proxies the screenshot provider
- Device presets live in `devices.js` — add/edit there

## Limitations

- Sites that block third-party crawlers (strict bot protection) may fail
- Login-gated pages aren't supported (no auth flow)
- Screenshots are static — no interactive testing
- For interactive cross-browser testing, use BrowserStack Live or similar
