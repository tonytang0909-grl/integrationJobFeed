# 🔌 Integration Job Feed — Australia

A local Playwright scraper that finds integration, API, middleware, and industry-specific tech jobs across Australia, generates an RSS feed, and pushes it to GitHub Pages. Run it manually once a day.

---

## 📡 Your Feed URL

```
https://tonytang0909-grl.github.io/integrationJobFeed/feed.xml
```

Subscribe in any RSS reader: **Feedly**, **NewsBlur**, **Outlook**, **Reeder**, etc.

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Run the scraper

```bash
node src/index.js
```

That's it. It will:
- Launch a headless Chrome browser
- Scrape Seek, Indeed AU, Jora, and CareerOne for all keywords
- Deduplicate and generate `docs/feed.xml`
- Auto-commit and push to GitHub Pages

### 3. Enable GitHub Pages (one-time)

Go to your repo → **Settings** → **Pages** → Source: `main` branch, `/docs` folder → Save.

---

## ⚙️ How It Works

```
node src/index.js
    │
    ▼
Playwright launches headless Chromium
    │
    ├── Seek       — scrolls results, extracts job cards
    ├── Indeed AU  — same
    ├── Jora AU    — same
    └── CareerOne  — same
    │
    ▼
Deduplicate by URL hash
Merge with existing feed (keep newest 200)
    │
    ▼
Write docs/feed.xml
git commit + push → GitHub Pages live
```

---

## 🔍 Keywords Covered

| Category | Keywords |
|---|---|
| Core roles | integration developer/engineer, API developer, middleware engineer, ETL developer, data pipeline, platform engineer |
| Platforms | MuleSoft, Boomi, iPaaS, Workato, n8n |
| Medical | HL7, FHIR, health informatics, clinical systems integration |
| Mining | SCADA integration, OT integration, PI System |
| Ecommerce | commerce integration, ERP integration, Shopify, BigCommerce |
| Finance | payment gateway developer, banking integration |

To add keywords, edit `ROLE_KEYWORDS` in `src/scraper.js`.

---

## 💰 Cost

**100% free.** Runs on your machine, serves via GitHub Pages.
