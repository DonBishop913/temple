// Minimal Puppeteer script to capture the Living Dashboard and save a screenshot.
// Usage: node scripts/capture_dashboard.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

async function capture() {
  const url = process.env.DASHBOARD_URL || "http://localhost:3000";
  const outDir = path.resolve("C:/Temple/Logs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "dashboard_power_widget.png");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    // Wait a short moment for widget to poll and render
    await new Promise((r) => setTimeout(r, 1500));
    // Optionally scroll to bring widget into view; adjust selector as needed
    try {
      const el = (await page.$('div[role="main"]')) || (await page.$("body"));
      if (el) await el.screenshot({ path: outPath, fullPage: false });
      else await page.screenshot({ path: outPath, fullPage: true });
    } catch (e) {
      await page.screenshot({ path: outPath, fullPage: true });
    }
    console.log("Saved screenshot to", outPath);
  } catch (e) {
    console.error("Capture failed:", e.message);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
}

capture();
