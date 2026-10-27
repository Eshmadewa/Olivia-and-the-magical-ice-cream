// A keyboard-only player. The game exposes a read-only diagnostic snapshot.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { createLevel } = require('../js/levels.js');
const server = process.env.TEST_START_SERVER ? require('../server.cjs') : null;
let browser;
(async () => {
  browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.clock.install();
  fs.mkdirSync('test-results', { recursive: true });
  await page.goto(process.env.TEST_URL || 'http://localhost:4173/preview-repo/');
  await page.locator('#start-button').click();
  const held = new Set();
  async function press(key, value) {
    if (value === held.has(key)) return;
    if (value) { await page.keyboard.down(key); held.add(key); }
    else { await page.keyboard.up(key); held.delete(key); }
  }
  for (let index = 0; index < 5; index++) {
    const world = createLevel(index);
    let state, steps = 0, lastHp = 3, bossHit = false;
    while (steps++ < 1800) {
      state = await page.evaluate(() => Olivia.inspect());
      if (state.scene !== 'playing') break;
      const p = state.player, b = state.boss;
      let right = true, left = false, jump = !p.grounded && p.vy < 0 && held.has('Space');
      if (p.grounded) {
        const edge = p.platform && p.platform.x + p.platform.w - (p.x + p.w);
        const nearGap = p.platform && edge >= -p.w && edge < 68 && !world.platforms.some(f => f.ground && f.x <= p.platform.x + p.platform.w + 1 && f.x + f.w > p.platform.x + p.platform.w + 10);
        const nearHazard = world.hazards.some(h => h.kind !== 'wind' && h.x > p.x - 15 && h.x - (p.x + p.w) < 77 && p.y + p.h > h.y - 5);
        const nearEnemy = state.enemies.some(e => e.x + e.w > p.x && e.x - (p.x + p.w) < 90 && e.y > p.y - 45);
        jump = !!(nearGap || nearHazard || nearEnemy);
        if (held.has('Space')) jump = false; // release before a new press
      }
      // A jump started to clear a creature may reach a pit too late. Brake in the
      // air, land on the near bank, then take a fresh full jump across the gap.
      if (!p.grounded && p.vy >= 0 && p.y + p.h < 448) {
        const fallTime = (-p.vy + Math.sqrt(p.vy * p.vy + 3000 * (448 - p.y - p.h))) / 1500;
        const landingX = p.x + 265 * fallTime;
        const floors = world.platforms.filter(f => f.ground);
        for (let i = 0; i < floors.length - 1; i++) {
          const edge = floors[i].x + floors[i].w;
          if (p.x < edge - 20 && landingX > edge - 10 && landingX + p.w < floors[i + 1].x + 10) right = false;
        }
      }
      if (b && !b.won && p.x > b.x - 200) {
        if (b.hp < lastHp) { lastHp = b.hp; bossHit = true; }
        const target = b.x - 130;
        right = p.x < target - 8; left = p.x > target + 8;
        if (b.crouch && b.cooldown <= 0 && !bossHit) {
          right = p.x < b.x - 15; left = p.x > b.x + 2;
          if (p.grounded && !held.has('Space')) jump = true;
        }
        if (!b.crouch && p.x < b.x - 95) bossHit = false;
        if (p.grounded && b.balls.some(ball => ball.x > p.x - 10 && ball.x < p.x + 120) && !held.has('Space')) jump = true;
      }
      await press('ArrowRight', right); await press('ArrowLeft', left); await press('Space', jump);
      await page.clock.runFor(32);
    }
    for (const key of [...held]) await press(key, false);
    console.log(`World ${index + 1}:`, JSON.stringify({ scene: state.scene, x: Math.round(state.player.x), hearts: state.hearts, scoops: state.collected, boss: state.boss, seconds: Math.round(state.levelTime) }));
    await page.screenshot({ path: `test-results/world-${index + 1}-result.png` });
    assert.equal(state.scene, 'won', `world ${index + 1} must be completable with keyboard controls`);
    if (index < 4) await page.getByRole('button', { name: 'В следующий мир →', exact: true }).click();
  }
  const completed = await page.evaluate(() => Olivia.inspect());
  await page.reload(); await page.locator('#outfits-nav').click();
  const outfitButtons = page.locator('.outfit');
  assert.ok(completed.uniqueScoops >= 120, 'playthrough earns all accessories');
  assert.equal(await outfitButtons.nth(3).isEnabled(), true, 'crown is unlocked');
  await outfitButtons.nth(3).click(); await page.locator('#close-dialog').click(); await page.reload();
  assert.equal(await page.evaluate(() => Olivia.inspect().outfit), 3, 'accessory persists');
  assert.equal(await page.evaluate(() => Olivia.inspect().unlocked), 5, 'all worlds persist');
  assert.equal(await page.evaluate(() => Olivia.inspect().uniqueScoops), completed.uniqueScoops, 'collection persists');
  await page.locator('#start-button').click(); await page.clock.runFor(32);
  assert.equal(await page.evaluate(() => Olivia.inspect().level), 4, 'continue opens final unlocked world');
  assert.deepEqual(errors, []); console.log('PASS: all five worlds, real movement, checkpoints, boss, completion, sequential unlocks.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); server?.close(); });
