const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  // Wait an extra second to let animations (heartbeat) render
  await page.waitForTimeout(1000);
  const path = "C:/Temple/dashboard_screenshot.png";
  await page.screenshot({ path, fullPage: true });
  console.log("Saved screenshot to", path);
  await browser.close();
})();
