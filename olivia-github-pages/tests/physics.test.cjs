const test = require('node:test');
const assert = require('node:assert/strict');
const { C, createPlayer, movePlayer, readSave, writeSave, overlap } = require('../js/core.js');
const { createLevel } = require('../js/levels.js');
const floor = { x: -1000, y: 448, w: 4000, h: 200 };
const input = (more = {}) => ({ left: false, right: false, jumpHeld: true, jumpPressed: false, ...more });

test('held jump is predictable, lands on exactly the surface, and travels over 200 pixels', () => {
  const p = createPlayer(); p.vx = C.speed;
  let minY = p.y, frames = 0;
  movePlayer(p, input({ right: true, jumpPressed: true }), [floor], C.step);
  while (!p.grounded && frames++ < 200) { movePlayer(p, input({ right: true }), [floor], C.step); minY = Math.min(minY, p.y); }
  assert.ok(394 - minY > 130); assert.ok(p.x > 300); assert.equal(p.y + p.h, 448);
});
test('released jump is lower than held jump', () => {
  const p = createPlayer(); movePlayer(p, input({ jumpPressed: true }), [floor], C.step);
  let minY = p.y;
  for (let i = 0; i < 150; i++) { movePlayer(p, input({ jumpHeld: false }), [floor], C.step); minY = Math.min(minY, p.y); }
  assert.ok(394 - minY < 100);
});
test('coyote jump works briefly after leaving an edge', () => {
  const p = createPlayer(); p.grounded = false; p.coyote = 0.07;
  assert.equal(movePlayer(p, input({ jumpPressed: true }), [], C.step), true);
  assert.ok(p.vy < -600);
});
test('cannot jump again in midair after coyote expires', () => {
  const p = createPlayer(); p.grounded = false; p.coyote = 0;
  assert.equal(movePlayer(p, input({ jumpPressed: true }), [], C.step), false);
});
test('jump pressed shortly before landing is buffered', () => {
  const p = createPlayer(); p.y = 388; p.vy = 280; p.grounded = false; p.coyote = 0;
  movePlayer(p, input({ jumpPressed: true }), [floor], C.step);
  let jumped = false;
  for (let i = 0; i < 12; i++) jumped ||= movePlayer(p, input(), [floor], C.step);
  assert.equal(jumped, true);
});
test('fast descent cannot tunnel through a thin platform', () => {
  const p = createPlayer(); p.y = 260; p.vy = 900; p.grounded = false; p.coyote = 0;
  for (let i = 0; i < 20; i++) movePlayer(p, input(), [{ x: 0, y: 320, w: 300, h: 4 }], C.step);
  assert.equal(p.y + p.h, 320); assert.equal(p.grounded, true);
});
test('rider is carried by a moving platform', () => {
  const plat = { x: 0, y: 448, w: 500, dx: 2, dy: -1 };
  const p = createPlayer(); p.platform = plat;
  movePlayer(p, input(), [plat], C.step);
  assert.equal(p.x, 102);
});
test('every required gap in all five levels is traversable with the actual physics', () => {
  for (let level = 0; level < 5; level++) {
    const floors = createLevel(level).platforms.filter(p => p.ground);
    for (let i = 0; i < floors.length - 1; i++) {
      const a = floors[i], b = floors[i + 1];
      const p = createPlayer(a.x + a.w - 85); p.vx = C.speed;
      movePlayer(p, input({ right: true, jumpPressed: true }), floors, C.step);
      for (let t = 0; t < 125 && !p.grounded; t++) movePlayer(p, input({ right: true }), floors, C.step);
      assert.ok(p.grounded && p.x + p.w > b.x, `world ${level + 1}, gap ${i + 1}`);
    }
  }
});
test('invalid saves and blocked storage do not break the game', () => {
  assert.equal(readSave({ getItem: () => '{' }).unlocked, 1);
  assert.equal(readSave({ getItem: () => { throw Error('blocked'); } }).unlocked, 1);
  const s = readSave({ getItem: () => JSON.stringify({ version: 1, unlocked: 999, outfit: 3, scoops: ['0:1', '0:1', 'bad'], stars: [99] }) });
  assert.equal(s.unlocked, 5); assert.equal(s.outfit, 0); assert.deepEqual(s.scoops, ['0:1']); assert.equal(s.stars[0], 3);
  assert.equal(writeSave({ setItem: () => { throw Error(); } }, s), false);
});
test('the secret star is reachable by a normal jump from the upper approach in every world', () => {
  for (let index = 0; index < 5; index++) {
    const world = createLevel(index), p = createPlayer(955, 366); p.vx = C.speed;
    movePlayer(p, input({ right: true, jumpPressed: true }), world.platforms, C.step);
    let touchesStar = false;
    for (let frame = 0; frame < 100; frame++) {
      movePlayer(p, input({ right: true }), world.platforms, C.step);
      if (overlap(p, world.secret)) touchesStar = true;
    }
    assert.ok(touchesStar, `world ${index + 1} secret is reachable`);
  }
});
