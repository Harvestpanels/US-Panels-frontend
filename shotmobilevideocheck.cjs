const { chromium, devices } = require('playwright');

async function test(url, label) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForTimeout(1500);
  await p.touchscreen.tap(100, 100); // trigger unlock fallback
  await p.waitForTimeout(800);

  const t1 = await p.evaluate(() => {
    const v = document.querySelector('.hp-bgvideo');
    return { paused: v?.paused, currentTime: v?.currentTime, loop: v?.loop };
  });
  console.log(label, 'right after unlock:', JSON.stringify(t1));

  await p.waitForTimeout(1500); // watch for a while with NO scrolling
  const t2 = await p.evaluate(() => {
    const v = document.querySelector('.hp-bgvideo');
    return { paused: v?.paused, currentTime: v?.currentTime };
  });
  console.log(label, 'after 1.5s idle (no scroll):', JSON.stringify(t2), t2.currentTime > t1.currentTime ? '<<< VIDEO IS PLAYING ON ITS OWN' : '(static, correct)');

  // now scroll and confirm it still scrubs
  await p.mouse.wheel(0, 800);
  await p.waitForTimeout(300);
  const t3 = await p.evaluate(() => {
    const v = document.querySelector('.hp-bgvideo');
    return { paused: v?.paused, currentTime: v?.currentTime };
  });
  console.log(label, 'after scroll:', JSON.stringify(t3));

  await b.close();
}

(async () => {
  await test('http://localhost:5183/', 'HOME');
  await test('http://localhost:5183/products', 'PRODUCTS');
  await test('http://localhost:5183/specs', 'SPECS');
})();
