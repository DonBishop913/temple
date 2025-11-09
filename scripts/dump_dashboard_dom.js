const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  await page.waitForTimeout(1000);
  const body = await page.evaluate(() => document.body.innerHTML);
  const outDir = "C:/Temple/test-output";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/dashboard_dom.html`, body.slice(0, 200000));
  console.log("Wrote dashboard_dom.html");
  await browser.close();
})();
