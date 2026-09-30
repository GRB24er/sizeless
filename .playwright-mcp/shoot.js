// Loads a page, scrolls through it so every reveal fires, and saves a full-page screenshot.
async (page) => {
  const targets = globalThis.__targets || [];
  const out = [];
  for (const [url, file] of targets) {
    await page.goto(url);
    await page.waitForTimeout(2200);
    const h = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 350) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
    await page.waitForTimeout(900);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(250);
    await page.screenshot({ path: file, fullPage: true });
    out.push([url, h]);
  }
  return out;
}
