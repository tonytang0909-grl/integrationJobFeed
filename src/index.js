const { scrapeAll } = require("./scraper");
const { generateFeed } = require("./generate-feed");
const { execSync } = require("child_process");
const path = require("path");

function gitPush() {
  try {
    const root = path.join(__dirname, "..");
    execSync("git add docs/feed.xml", { cwd: root, stdio: "inherit" });
    // Only commit if there are staged changes
    const diff = execSync("git diff --staged --name-only", { cwd: root }).toString().trim();
    if (!diff) {
      console.log("No changes to feed, skipping commit.");
      return;
    }
    const date = new Date().toISOString().slice(0, 16).replace("T", " ");
    execSync('git commit -m "chore: update job feed [' + date + '] UTC"', { cwd: root, stdio: "inherit" });
    execSync("git push origin main", { cwd: root, stdio: "inherit" });
    console.log("Feed pushed to GitHub Pages.");
  } catch (err) {
    console.warn("Git push failed (you can push manually):", err.message);
  }
}

async function main() {
  console.log("Job feed update started:", new Date().toISOString());
  const jobs = await scrapeAll();
  const total = generateFeed(jobs);
  console.log("Feed contains " + total + " jobs.");
  console.log("\nPushing to GitHub...");
  gitPush();
  console.log("Done.");
}

main().catch(function(err) {
  console.error("Fatal error:", err);
  process.exit(1);
});
