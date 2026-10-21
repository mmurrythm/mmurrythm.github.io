import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const base = "https://mmurrythm.github.io";
const outDir = "reports";
const lighthouseDir = path.join(outDir, "lighthouse");
fs.mkdirSync(lighthouseDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getSitemap() {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const response = await fetch(`${base}/sitemap.xml`, { cache: "no-store" });
      if (!response.ok) throw new Error(`sitemap returned HTTP ${response.status}`);
      const xml = await response.text();
      const urls = [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)].map((match) => match[1].trim());
      if (!urls.length) throw new Error("sitemap contains no <loc> URLs");
      return urls;
    } catch (error) {
      lastError = error;
      await sleep(5000);
    }
  }
  throw lastError;
}

const urls = await getSitemap();
const browser = await chromium.launch({ headless: true });
const results = [];
const internalLinks = new Map();

try {
  for (const url of urls) {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.url()} — ${request.failure()?.errorText ?? "request failed"}`);
    });

    let status = null;
    let title = "";
    let canonical = "";
    let h1 = "";
    let mobileOverflow = false;
    let navigationError = null;
    let links = [];

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      status = response?.status() ?? null;
      await page.waitForTimeout(1200);
      title = await page.title().catch(() => "");
      canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href").catch(() => "");
      h1 = (await page.locator("h1").allTextContents().catch(() => [])).join(" ").trim();
      links = await page.locator("a[href]").evaluateAll((nodes) => nodes.map((node) => node.href));
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    } catch (error) {
      navigationError = error.message;
    }

    for (const href of links) {
      try {
        const parsed = new URL(href);
        if (parsed.origin !== new URL(base).origin || parsed.protocol !== "https:") continue;
        parsed.hash = "";
        internalLinks.set(parsed.href, parsed.href);
      } catch {}
    }

    results.push({
      url, status, title, canonical, h1, mobileOverflow,
      navigationError, consoleErrors, pageErrors, failedRequests,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

const linkResults = [];
for (const url of internalLinks.keys()) {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    linkResults.push({ url, status: response.status, ok: response.ok });
  } catch (error) {
    linkResults.push({ url, status: null, ok: false, error: error.message });
  }
}

const chromePath = execFileSync(
  process.execPath,
  ["-e", "console.log(require('playwright').chromium.executablePath())"],
  { encoding: "utf8" }
).trim();

const lighthouseResults = [];
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  const slug = new URL(url).pathname.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "home";
  const reportBase = path.join(lighthouseDir, `${String(i + 1).padStart(2, "0")}-${slug}`);
  try {
    execFileSync("npx", [
      "--no-install", "lighthouse", url,
      "--chrome-path", chromePath,
      "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
      "--output=json", "--output=html",
      `--output-path=${reportBase}`, "--quiet",
    ], { stdio: "pipe", timeout: 180000 });
    const report = JSON.parse(fs.readFileSync(`${reportBase}.report.json`, "utf8"));
    const categories = report.lighthouseResult?.categories ?? report.categories ?? {};
    const scores = {};
    for (const name of ["performance", "accessibility", "best-practices", "seo"]) {
      scores[name] = categories[name]?.score == null ? null : Math.round(categories[name].score * 100);
    }
    lighthouseResults.push({ url, report: `${reportBase}.report.html`, scores });
  } catch (error) {
    lighthouseResults.push({ url, report: null, error: String(error.message).slice(0, 500) });
  }
}

const summary = {
  checkedAt: new Date().toISOString(),
  pages: results,
  internalLinks: linkResults,
  lighthouse: lighthouseResults,
};
fs.writeFileSync(path.join(outDir, "site-check.json"), JSON.stringify(summary, null, 2));

const md = [
  "# Website Observatory Report",
  "",
  `- Checked: ${summary.checkedAt}`,
  `- Sitemap pages: ${urls.length}`,
  `- Internal links checked: ${linkResults.length}`,
  "",
  "## Page smoke tests",
  "",
  "| Page | HTTP | Title | Canonical | Mobile overflow | JS errors |",
  "|---|---:|---|---|---|---:|",
  ...results.map((r) => `| [${new URL(r.url).pathname || "/"}](${r.url}) | ${r.status ?? "ERROR"} | ${r.title.replace(/\|/g, "\\|").slice(0, 70)} | ${r.canonical ? "present" : "missing"} | ${r.mobileOverflow ? "yes" : "no"} | ${r.pageErrors.length + r.consoleErrors.length} |`),
  "",
  "## Internal link checks",
  "",
  `- Broken/unreachable links: ${linkResults.filter((r) => !r.ok).length}`,
  ...linkResults.filter((r) => !r.ok).map((r) => `- **FAIL** ${r.status ?? "network error"} — ${r.url} ${r.error ?? ""}`),
  "",
  "## Lighthouse scores",
  "",
  "| Page | Performance | Accessibility | Best practices | SEO | Report |",
  "|---|---:|---:|---:|---:|---|",
  ...lighthouseResults.map((r) => `| ${new URL(r.url).pathname || "/"} | ${r.scores?.performance ?? "n/a"} | ${r.scores?.accessibility ?? "n/a"} | ${r.scores?.["best-practices"] ?? "n/a"} | ${r.scores?.seo ?? "n/a"} | ${r.report ? path.basename(r.report) : "audit failed"} |`),
  "",
  "## Warnings and errors",
  "",
  ...results.flatMap((r) => [
    ...(r.navigationError ? [`- **Navigation error** ${r.url}: ${r.navigationError}`] : []),
    ...r.pageErrors.map((e) => `- **Page error** ${r.url}: ${e}`),
    ...r.consoleErrors.map((e) => `- Console error ${r.url}: ${e}`),
    ...r.failedRequests.map((e) => `- Failed request ${r.url}: ${e}`),
    ...(r.mobileOverflow ? [`- **Possible mobile horizontal overflow**: ${r.url}`] : []),
    ...(!r.canonical ? [`- **Missing canonical**: ${r.url}`] : []),
  ]),
  "",
  "_Synthetic test visits are automated checks and must not be interpreted as real visitor traffic._",
  "",
];
fs.writeFileSync(path.join(outDir, "summary.md"), md.join("\n"));

const badPages = results.filter((r) => !r.status || r.status >= 400 || r.navigationError);
const badLinks = linkResults.filter((r) => !r.ok);
console.log(`Checked ${results.length} pages and ${linkResults.length} internal links.`);
console.log(`Page failures: ${badPages.length}; broken links: ${badLinks.length}; Lighthouse audits completed: ${lighthouseResults.filter((r) => r.scores).length}/${urls.length}.`);
if (badPages.length || badLinks.length) process.exitCode = 1;
