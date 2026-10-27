(function (root) {
  'use strict';
  const C = { width: 960, height: 540, step: 1 / 120, gravity: 1500, jump: 650,
    speed: 265, acceleration: 1900, friction: 2200, coyote: 0.11, buffer: 0.14 };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const approach = (n, target, delta) => n < target ? Math.min(n + delta, target) : Math.max(n - delta, target);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function createPlayer(x = 100, floor = 448) {
    return { x, y: floor - 54, w: 42, h: 54, vx: 0, vy: 0, facing: 1, grounded: true,
      coyote: C.coyote, buffer: 0, platform: null, landed: 0, joy: 0, hurt: 0 };
  }
  function movePlayer(p, input, platforms, dt) {
    dt = Math.min(dt, 1 / 30);
    p.landed = Math.max(0, p.landed - dt);
    p.joy = Math.max(0, p.joy - dt);
    p.hurt = Math.max(0, p.hurt - dt);
    if (p.grounded && p.platform) { p.x += p.platform.dx || 0; p.y += p.platform.dy || 0; }
    p.coyote = p.grounded ? C.coyote : Math.max(0, p.coyote - dt);
    p.buffer = input.jumpPressed ? C.buffer : Math.max(0, p.buffer - dt);
    const direction = Number(input.right) - Number(input.left);
    p.vx = approach(p.vx, direction * C.speed, (direction ? C.acceleration : C.friction) * dt);
    if (direction) p.facing = direction;
    let jumped = false;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -C.jump; p.grounded = false; p.coyote = 0; p.buffer = 0; p.platform = null; jumped = true;
    }
    if (!input.jumpHeld && p.vy < -260) p.vy += C.gravity * dt * 1.7;
    p.vy = Math.min(900, p.vy + C.gravity * dt);
    const previousBottom = p.y + p.h;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.grounded = false; p.platform = null;
    // Swept foot collision: even a fast fall cannot skip a platform top.
    if (p.vy >= 0) {
      let landing = null;
      for (const platform of platforms) {
        const previousTop = platform.y - (platform.dy || 0);
        if (p.x + p.w > platform.x + 2 && p.x < platform.x + platform.w - 2 &&
            previousBottom <= previousTop + 3 && p.y + p.h >= platform.y &&
            (!landing || platform.y < landing.y)) landing = platform;
      }
      if (landing) {
        if (p.vy > 170) p.landed = 0.15;
        p.y = landing.y - p.h; p.vy = 0; p.grounded = true; p.platform = landing;
      }
    }
    return jumped;
  }
  function defaultSave() { return { version: 1, unlocked: 1, scoops: [], stars: [0, 0, 0, 0, 0], best: [0, 0, 0, 0, 0], outfit: 0, sound: true }; }
  function readSave(storage) {
    const fallback = defaultSave();
    try {
      const s = JSON.parse(storage.getItem('olivia-adventure-v1'));
      if (!s || s.version !== 1) return fallback;
      const finite = (n, max) => Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
      const scoops = Array.isArray(s.scoops) ? [...new Set(s.scoops.filter(id => typeof id === 'string' && /^[0-4]:\d{1,3}$/.test(id)))].slice(0, 500) : [];
      const thresholds = [0, 25, 65, 120];
      const outfit = finite(s.outfit, 3);
      return { version: 1, unlocked: clamp(finite(s.unlocked, 5), 1, 5), scoops,
        stars: fallback.stars.map((_, i) => finite(s.stars?.[i], 3)),
        best: fallback.best.map((_, i) => finite(s.best?.[i], 999999)),
        outfit: scoops.length >= thresholds[outfit] ? outfit : 0, sound: s.sound !== false };
    } catch { return fallback; }
  }
  function writeSave(storage, save) {
    try { storage.setItem('olivia-adventure-v1', JSON.stringify(save)); return true; } catch { return false; }
  }
  const api = { C, clamp, approach, overlap, createPlayer, movePlayer, defaultSave, readSave, writeSave };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Olivia = Object.assign(root.Olivia || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
