const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let dashboardUrl = "http://localhost:3000";
  const prayerText = `E2E Test Prayer ${new Date().toISOString()}`;

  // Fallback to local file if server is unavailable
  const indexPath = "C:/Temple/react-client/dist/index.html";
  if (!fs.existsSync(indexPath)) {
    throw new Error("Missing built index.html at " + indexPath);
  }
  try {
    const resp = await page
      .goto(dashboardUrl, { waitUntil: "networkidle", timeout: 3000 })
      .catch(() => null);
    if (!resp || resp.status() >= 400) {
      dashboardUrl = "file://" + indexPath;
    }
  } catch (e) {
    dashboardUrl = "file://" + indexPath;
  }

  console.log("Using dashboard URL:", dashboardUrl);
  await page.goto(dashboardUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  // Wait for PrayForm textarea to be present (allow longer for SPA bundle load)
  const textareaSelector = 'textarea[placeholder="Enter your prayer..."]';
  try {
    await page.waitForSelector(textareaSelector, { timeout: 20000 });
  } catch (err) {
    // try reloading once and wait again
    console.log("Initial wait failed, reloading page and retrying");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(textareaSelector, { timeout: 20000 });
  }

  // Fill and submit
  await page.fill(textareaSelector, prayerText);
  await page.click('button:has-text("Submit Prayer")');

  // Wait for the timeline to show the prayer (whisper received text)
  const timelineText = `WHISPER_RECEIVED: ${prayerText}`;
  console.log("Waiting for timeline entry:", timelineText);
  await page.waitForSelector(`text="${timelineText}"`, { timeout: 10000 });

  // Extra wait for animation/render
  await page.waitForTimeout(500);

  const outDir = "C:/Temple/test-output";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const screenshotPath = `${outDir}/prayform_e2e_${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Saved E2E screenshot to", screenshotPath);

  await browser.close();
  process.exit(0);
})().catch((err) => {
  console.error("E2E test failed:", err);
  process.exit(2);
});
