const fs = require("fs");
const path = require("path");

const FEED_PATH = path.join(__dirname, "../docs/feed.xml");
const MAX_ITEMS = 200;

function escapeXML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRFC822(dateStr) {
  try {
    return new Date(dateStr).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

function loadExistingJobs() {
  if (!fs.existsSync(FEED_PATH)) return [];
  try {
    const xml = fs.readFileSync(FEED_PATH, "utf8");
    const jobs = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let m;
    while ((m = itemRegex.exec(xml)) !== null) {
      const block = m[1];
      const get = (tag) => {
        const r = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([^<]*)</${tag}>`);
        const match = r.exec(block);
        return match ? (match[1] || match[2] || "").trim() : "";
      };
      jobs.push({
        id: get("guid"),
        title: get("title"),
        company: get("author"),
        location: get("location"),
        url: get("link"),
        description: get("description"),
        date: get("pubDate"),
        source: get("source"),
        keyword: get("category"),
      });
    }
    return jobs;
  } catch {
    return [];
  }
}

function generateFeed(newJobs) {
  const existing = loadExistingJobs();

  // Merge: new jobs first, then existing (dedup by id)
  const seen = new Set();
  const merged = [...newJobs, ...existing].filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  // Sort newest first, cap at MAX_ITEMS
  const sorted = merged
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, MAX_ITEMS);

  const now = new Date().toUTCString();
  const baseUrl = process.env.GITHUB_PAGES_URL || "https://example.github.io/job-feed";

  const items = sorted
    .map(
      (job) => `
  <item>
    <title><![CDATA[${job.title}${job.company ? ` — ${job.company}` : ""}]]></title>
    <link>${escapeXML(job.url)}</link>
    <guid isPermaLink="false">${escapeXML(job.id)}</guid>
    <pubDate>${toRFC822(job.date)}</pubDate>
    <author><![CDATA[${job.company || ""}]]></author>
    <location><![CDATA[${job.location || "Australia"}]]></location>
    <category><![CDATA[${job.keyword || ""}]]></category>
    <source><![CDATA[${job.source || ""}]]></source>
    <description><![CDATA[${job.description || ""}]]></description>
  </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Integration Jobs — Australia</title>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Integration, API, middleware and industry-specific tech jobs across Australia. Updated every 6 hours.</description>
    <language>en-au</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>360</ttl>
    <image>
      <url>https://github.githubassets.com/favicons/favicon.png</url>
      <title>Integration Jobs Australia</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

  fs.mkdirSync(path.dirname(FEED_PATH), { recursive: true });
  fs.writeFileSync(FEED_PATH, xml, "utf8");

  console.log(`📰 Feed written: ${sorted.length} jobs → ${FEED_PATH}`);
  return sorted.length;
}

module.exports = { generateFeed };
