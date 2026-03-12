# SnipTube - Project Status

## What is SnipTube
A YouTube video downloader & MP3 converter web app. Users paste a YouTube URL, choose MP4 or MP3, optionally trim by time range, and download the result.

## Tech Stack
- **Backend:** Node.js + Express.js
- **Frontend:** Vanilla HTML/CSS/JS (single page in `public/index.html`)
- **Dependencies:** yt-dlp (video download), ffmpeg (conversion/trimming)
- **Containerized:** Dockerfile included (Node 20 slim + ffmpeg + yt-dlp)

## Domain
- Chose **sniptube.live** — not yet purchased/registered
- All URLs in the codebase point to `https://sniptube.live/`

## GitHub Repo
- Pushed to: **https://github.com/giladbas/sniptube**
- Branch: `main`, 2 commits

## What's Done

### Rename
- Renamed from SliceTube → **SnipTube** everywhere (package.json, server.js, index.html)

### SEO (fully implemented)
- Title tag: "SnipTube - Free YouTube Video Downloader & MP3 Converter Online"
- Meta description with high-volume keywords
- Meta keywords targeting: youtube downloader, youtube to mp3, youtube to mp4, etc.
- Open Graph + Twitter Card meta tags
- Canonical URL → https://sniptube.live/
- JSON-LD structured data: WebApplication schema + FAQPage schema (5 questions)
- `robots.txt` — allows crawling, blocks /api/ and /downloads/
- `sitemap.xml` — single page, ready for Google Search Console
- SEO content sections with keyword-rich copy (how-to, features, FAQ)
- 6 FAQ items in HTML (matching the JSON-LD schema)
- Semantic HTML with proper h1/h2/h3 hierarchy and aria-labels

### Ads (fully implemented — needs AdSense account)
6 ad placements added to index.html:

1. **Top leaderboard** (728x90) — above the app
2. **Mid rectangle** (300x250) — between video preview and download controls
3. **Bottom rectangle** (300x250) — below the main app
4. **In-content rectangle** (300x250) — inside SEO text section
5. **Download interstitial** — full-screen overlay with 5-second countdown before download starts
6. **Sticky bottom banner** — fixed to bottom of screen (mobile)

All slots use Google AdSense `<ins class="adsbygoogle">` tags with placeholder IDs.

### Deployment Prep
- Dockerfile created (Node 20 slim, installs ffmpeg + yt-dlp)
- Server uses `process.env.PORT || 3000` for Railway/Render compatibility
- `.gitignore` set up (node_modules, downloads, .DS_Store)

## What's NOT Done

### 1. Buy the domain
- Purchase `sniptube.live` from any registrar (Namecheap, Cloudflare, Google Domains)

### 2. Deploy the app
- Railway trial expired — needs paid plan ($5/mo) OR use a free alternative:
  - **Render** (750 free hrs/month, supports Docker) — recommended
  - **Fly.io** (3 free shared VMs)
  - **Koyeb** (1 free nano instance)
- Cannot use Cloudflare Workers/Pages — app needs yt-dlp and ffmpeg binaries

### 3. Google AdSense setup
- Sign up at https://adsense.google.com with your domain
- Get your publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`)
- Replace ALL occurrences of `ca-pub-XXXXXXXXXXXXXXXX` in `public/index.html` (appears in 7 places: 1 in the script tag + 6 ad slots)
- Replace these slot IDs with real ones from AdSense:
  - `TOP_LEADERBOARD_SLOT_ID`
  - `MID_RECTANGLE_SLOT_ID`
  - `BOTTOM_RECTANGLE_SLOT_ID`
  - `CONTENT_RECTANGLE_SLOT_ID`
  - `OVERLAY_RECTANGLE_SLOT_ID`
  - `STICKY_BOTTOM_SLOT_ID`

### 4. Google Search Console
- Register site at https://search.google.com/search-console
- Verify domain ownership
- Submit sitemap: `https://sniptube.live/sitemap.xml`

### 5. Create OG image
- Create a 1200x630px image for social sharing
- Save as `public/og-image.png`

### 6. Point domain to deployment
- After deploying, configure DNS for `sniptube.live` to point to your hosting provider

## File Structure
```
├── .gitignore
├── Dockerfile
├── package.json
├── package-lock.json
├── server.js              (Express API: /api/info, /api/download)
├── public/
│   ├── index.html         (Full app UI + SEO + ads)
│   ├── robots.txt
│   └── sitemap.xml
└── STATUS.md              (this file)
```
