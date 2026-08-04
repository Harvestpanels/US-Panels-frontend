const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 300 } });
  await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);

  const times = [1350, 1450, 1500, 1550, 1580, 1595, 1600, 1605, 1620, 1650, 1700];
  for (const t of times) {
    const info = await page.evaluate((t) => {
      const anims = document.getAnimations();
      for (const a of anims) a.pause();
      for (const a of anims) a.currentTime = t;
      const overlay = document.querySelector(".hp-nav__fold-logo img");
      const overlayWrap = document.querySelector(".hp-nav__fold-logo");
      const realSlot = document.querySelector(".hp-nav__logo-slot");
      const real = realSlot?.querySelector("img");
      const pill = document.querySelector(".hp-nav__pill");
      const r = real?.getBoundingClientRect();
      const p = pill?.getBoundingClientRect();
      const o = overlay?.getBoundingClientRect();
      return {
        pillW: p?.width,
        realX: r?.x, realOp: real ? getComputedStyle(realSlot).opacity : null,
        overlayX: o?.x, overlayOp: overlay ? getComputedStyle(overlayWrap).opacity : null,
        diffX: (o && r) ? (o.x - r.x) : null,
      };
    }, t);
    await page.screenshot({ path: `C:/Users/USER/AppData/Local/Temp/scrub-${String(t).padStart(4,"0")}.png`, clip: { x: 0, y: 0, width: 1440, height: 130 } });
    console.log(`t=${t}ms`, JSON.stringify(info));
  }
  await browser.close();
})();
