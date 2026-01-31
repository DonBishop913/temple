const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000", {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  // Wait briefly for socket events and animations
  await page.waitForTimeout(1200);

  // Try to find heartbeat orb: search for elements with text 'heartbeat' or class 'heartbeat' or element with aria-label
  const heartbeat = await page.$$(
    "[class*=heart], [class*=orb], [aria-label*=heartbeat], [data-testid*=heartbeat]",
  );
  const heartbeatPresent = heartbeat.length > 0;
  let heartbeatInfo = "not found";
  if (heartbeatPresent) {
    heartbeatInfo = await heartbeat[0].evaluate((el) => ({
      tag: el.tagName,
      class: el.className,
      text: el.innerText.slice(0, 200),
    }));
  }

  // Read BurdenTimeline entries
  const timelineSelector = 'div:has(h2:has-text("Burden Assumption Timeline"))';
  const timeline = await page.$(timelineSelector);
  let entries = [];
  if (timeline) {
    const lis = await timeline.$$("li");
    for (const li of lis) {
      const text = (await li.innerText()).trim();
      entries.push(text);
    }
  }

  console.log(
    JSON.stringify({ heartbeatPresent, heartbeatInfo, entries }, null, 2),
  );
  await browser.close();
})();
