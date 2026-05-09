const { chromium } = require("playwright");

// ─── SEARCH KEYWORDS ────────────────────────────────────────────────────────

const ROLE_KEYWORDS = [
  // Core integration roles
  "integration developer",
  "integration engineer",
  "API developer",
  "middleware engineer",
  "systems integration",
  "platform engineer",
  "iPaaS developer",
  "MuleSoft",
  "Boomi",
  "ETL developer",
  "data pipeline engineer",
  // Medical / Health
  "HL7 developer",
  "FHIR developer",
  "health informatics",
  "clinical systems integration",
  // Mining / Resources
  "SCADA integration",
  "OT integration",
  "PI System engineer",
  // Ecommerce / Retail
  "commerce integration",
  "ERP integration",
  "Shopify developer",
  "BigCommerce developer",
  // SaaS / Automation
  "Workato developer",
  "n8n developer",
  // Finance
  "payment gateway developer",
  "banking integration",
];

// ─── HELPERS ────────────────────────────────────────────────────────────────

// WITH THIS:
const crypto = require("crypto");
function slugify(str) {
  return crypto.createHash("md5").update(String(str)).digest("hex");
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;
        if (total >= 3000) { clearInterval(timer); resolve(); }
      }, 200);
    });
  });
}

async function randomDelay(min, max) {
  min = min || 1200;
  max = max || 2500;
  const ms = Math.floor(Math.random() * (max - min) + min);
  await new Promise(function(r) { setTimeout(r, ms); });
}

// ─── SEEK SCRAPER ────────────────────────────────────────────────────────────

async function scrapeSeek(page, keyword) {
  const jobs = [];
  try {
    const url = "https://www.seek.com.au/jobs?keywords=" + encodeURIComponent(keyword) + "&where=All+Australia&sortmode=ListedDate";
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await autoScroll(page);

    const results = await page.evaluate(function() {
      const cards = document.querySelectorAll('[data-automation="normalJob"], [data-automation="featuredJob"]');
      return Array.from(cards).map(function(card) {
        const titleEl = card.querySelector('[data-automation="jobTitle"]');
        const companyEl = card.querySelector('[data-automation="jobCompany"]');
        const locationEl = card.querySelector('[data-automation="jobLocation"]');
        const linkEl = card.querySelector('a[data-automation="jobTitle"]');
        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          company: companyEl ? companyEl.innerText.trim() : "",
          location: locationEl ? locationEl.innerText.trim() : "Australia",
          url: linkEl ? linkEl.href : "",
        };
      });
    });

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.title || !r.url) continue;
      jobs.push({
        id: slugify(r.url),
        title: r.title,
        company: r.company,
        location: r.location,
        url: r.url,
        description: "",
        date: new Date().toISOString(),
        source: "Seek",
        keyword: keyword,
      });
    }
    console.log("  Seek [" + keyword + "]: " + jobs.length + " jobs");
  } catch (err) {
    console.warn("  Seek [" + keyword + "]: " + err.message);
  }
  return jobs;
}

// ─── INDEED SCRAPER ──────────────────────────────────────────────────────────

async function scrapeIndeed(page, keyword) {
  const jobs = [];
  try {
    const url = "https://au.indeed.com/jobs?q=" + encodeURIComponent(keyword) + "&l=Australia&sort=date";
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await autoScroll(page);

    const results = await page.evaluate(function() {
      const cards = document.querySelectorAll(".job_seen_beacon");
      return Array.from(cards).map(function(card) {
        const titleEl = card.querySelector('h2.jobTitle a');
        const companyEl = card.querySelector('[data-testid="company-name"], .companyName');
        const locationEl = card.querySelector('[data-testid="text-location"], .companyLocation');
        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          company: companyEl ? companyEl.innerText.trim() : "",
          location: locationEl ? locationEl.innerText.trim() : "Australia",
          url: titleEl ? titleEl.href : "",
        };
      });
    });

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.title || !r.url) continue;
      jobs.push({
        id: slugify(r.url),
        title: r.title,
        company: r.company,
        location: r.location,
        url: r.url.startsWith("http") ? r.url : "https://au.indeed.com" + r.url,
        description: "",
        date: new Date().toISOString(),
        source: "Indeed",
        keyword: keyword,
      });
    }
    console.log("  Indeed [" + keyword + "]: " + jobs.length + " jobs");
  } catch (err) {
    console.warn("  Indeed [" + keyword + "]: " + err.message);
  }
  return jobs;
}

// ─── JORA SCRAPER ────────────────────────────────────────────────────────────

async function scrapeJora(page, keyword) {
  const jobs = [];
  try {
    const url = "https://au.jora.com/j?q=" + encodeURIComponent(keyword) + "&l=Australia&sp=recently_posted";
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await autoScroll(page);

    const results = await page.evaluate(function() {
      const cards = document.querySelectorAll("article.result, [data-testid='job-card']");
      return Array.from(cards).map(function(card) {
        const titleEl = card.querySelector("a.job-link, [data-testid='job-title']");
        const companyEl = card.querySelector(".company, [data-testid='company-name']");
        const locationEl = card.querySelector(".location, [data-testid='job-location']");
        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          company: companyEl ? companyEl.innerText.trim() : "",
          location: locationEl ? locationEl.innerText.trim() : "Australia",
          url: titleEl ? titleEl.href : "",
        };
      });
    });

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.title || !r.url) continue;
      jobs.push({
        id: slugify(r.url),
        title: r.title,
        company: r.company,
        location: r.location,
        url: r.url.startsWith("http") ? r.url : "https://au.jora.com" + r.url,
        description: "",
        date: new Date().toISOString(),
        source: "Jora",
        keyword: keyword,
      });
    }
    console.log("  Jora [" + keyword + "]: " + jobs.length + " jobs");
  } catch (err) {
    console.warn("  Jora [" + keyword + "]: " + err.message);
  }
  return jobs;
}

// ─── CAREERONE SCRAPER ───────────────────────────────────────────────────────

async function scrapeCareerOne(page, keyword) {
  const jobs = [];
  try {
    const url = "https://www.careerone.com.au/jobs?q=" + encodeURIComponent(keyword) + "&where=Australia&sort=date";
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
    await autoScroll(page);

    const results = await page.evaluate(function() {
      const cards = document.querySelectorAll("article, [class*='job-card'], [class*='jobCard']");
      return Array.from(cards).map(function(card) {
        const titleEl = card.querySelector("h2 a, h3 a, [class*='job-title'] a");
        const companyEl = card.querySelector("[class*='company'], [class*='employer']");
        const locationEl = card.querySelector("[class*='location']");
        return {
          title: titleEl ? titleEl.innerText.trim() : "",
          company: companyEl ? companyEl.innerText.trim() : "",
          location: locationEl ? locationEl.innerText.trim() : "Australia",
          url: titleEl ? titleEl.href : "",
        };
      });
    });

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (!r.title || !r.url) continue;
      if (r.title.toLowerCase() === "search jobs") continue;
      jobs.push({
        id: slugify(r.url),
        title: r.title,
        company: r.company,
        location: r.location,
        url: r.url.startsWith("http") ? r.url : "https://www.careerone.com.au" + r.url,
        description: "",
        date: new Date().toISOString(),
        source: "CareerOne",
        keyword: keyword,
      });
    }
    console.log("  CareerOne [" + keyword + "]: " + jobs.length + " jobs");
  } catch (err) {
    console.warn("  CareerOne [" + keyword + "]: " + err.message);
  }
  return jobs;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

async function scrapeAll() {
  console.log("Launching browser...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "en-AU",
    timezoneId: "Australia/Adelaide",
  });

  await context.addInitScript(function() {
    Object.defineProperty(navigator, "webdriver", { get: function() { return undefined; } });
  });

  const allJobs = [];
  const scrapers = [
    { name: "Seek", fn: scrapeSeek },
    { name: "Indeed", fn: scrapeIndeed },
    { name: "Jora", fn: scrapeJora },
    { name: "CareerOne", fn: scrapeCareerOne },
  ];

  for (let s = 0; s < scrapers.length; s++) {
    const scraper = scrapers[s];
    console.log("\nScraping " + scraper.name + "...");
    const page = await context.newPage();

    await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}", function(route) {
      route.abort();
    });

    for (let k = 0; k < ROLE_KEYWORDS.length; k++) {
      const jobs = await scraper.fn(page, ROLE_KEYWORDS[k]);
      allJobs.push.apply(allJobs, jobs);
      await randomDelay();
    }

    await page.close();
  }

  await browser.close();

  // Deduplicate by ID
  const seen = new Set();
  const unique = allJobs.filter(function(job) {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  console.log("\nTotal unique jobs found: " + unique.length);
  return unique;
}

module.exports = { scrapeAll };
