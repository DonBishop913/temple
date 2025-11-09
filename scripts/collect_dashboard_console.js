const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("console", (msg) => {
    console.log("PAGE_CONSOLE:", msg.type(), msg.text());
  });
  page.on("pageerror", (err) => {
    console.error("PAGE_ERROR:", err.message);
  });
  try {
    await page.goto("http://localhost:3000", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    console.log(
      "DOM snapshot length:",
      await page.evaluate(() => document.body.innerHTML.length),
    );
  } catch (err) {
    console.error("NAV_ERROR:", err.message);
  }
  await browser.close();
  process.exit(0);
})();
