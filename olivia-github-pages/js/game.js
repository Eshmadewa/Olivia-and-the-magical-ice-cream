(function (O) {
  'use strict';
  const { C, Art: A, clamp, overlap } = O;
  const $ = id => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d', { alpha: false });
  const frame = $('game-frame'), dialog = $('menu-dialog');
  const sound = new O.Sound();
  document.body.classList.toggle('touch-device', navigator.maxTouchPoints > 0);
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  let save = O.readSave(storage), collectedIds = new Set(save.scoops);
  sound.setEnabled(save.sound);
  let scene = 'home', level = null, player = null, camera = 0, elapsed = 0, sceneTime = 0;
  let hearts = 3, score = 0, collected = 0, checkpoint = 100, particles = [], popups = [];
  let toastTime = 0, previousTime = 0, accumulator = 0, viewportWidth = 960, lastHud = '';
  let dialogWasPlaying = false, priorFocus = null, storageWarned = false, levelTime = 0;
  const input = { left: false, right: false, jumpHeld: false, jumpPressed: false };
  const keys = new Set(), pointers = new Map();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const outfits = [{ name: 'В путь!', hint: 'Любимый костюм', cost: 0 }, { name: 'Клубничный шарф', hint: '25 мороженых', cost: 25 },
    { name: 'Мятный шарф', hint: '65 мороженых', cost: 65 }, { name: 'Маленькая корона', hint: '120 мороженых', cost: 120 }];

  function persist() {
    save.scoops = [...collectedIds];
    if (!O.writeSave(storage, save) && !storageWarned) {
      storageWarned = true; $('save-note').textContent = 'Прогресс сохранится только в этой вкладке';
    }
  }
  function announce(text) { $('announcer').textContent = text; }
  function toast(text, duration = 3.5) { $('level-toast').textContent = text; $('level-toast').hidden = false; toastTime = duration; announce(text); }
  function clearInput() {
    keys.clear(); pointers.clear(); input.left = input.right = input.jumpHeld = input.jumpPressed = false;
    document.querySelectorAll('[data-control]').forEach(b => b.classList.remove('pressed'));
  }
  function syncInput() {
    const held = [...pointers.values()];
    input.left = keys.has('ArrowLeft') || keys.has('KeyA') || held.includes('left');
    input.right = keys.has('ArrowRight') || keys.has('KeyD') || held.includes('right');
    const jump = keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || held.includes('jump');
    if (jump && !input.jumpHeld) input.jumpPressed = true;
    input.jumpHeld = jump;
  }
  function resize() {
    viewportWidth = scene === 'home' ? 960 : Math.min(960, Math.max(600, Math.round(540 * frame.clientWidth / frame.clientHeight)));
    canvas.width = viewportWidth; canvas.height = 540; ctx.imageSmoothingEnabled = false;
  }
  new ResizeObserver(resize).observe(frame);

  function updateHud() {
    const value = `${hearts}:${collected}:${level?.index}`;
    if (lastHud === value || !level) return;
    lastHud = value;
    $('hud-world').textContent = `0${level.index + 1} / 05`;
    $('hud-name').textContent = level.theme.name;
    $('scoop-count').textContent = collected;
    $('scoop-total').textContent = `/ ${level.scoops.length}`;
    $('hearts').textContent = '♥ '.repeat(hearts) + '♡ '.repeat(3 - hearts);
    $('hearts').setAttribute('aria-label', `Сердец: ${hearts} из 3`);
  }
  function burst(x, y, color = '#f1b0be', count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      particles.push({ x, y, vx: Math.cos(angle) * (35 + Math.random() * 95), vy: Math.sin(angle) * 90 - 65,
        life: 0.6 + Math.random() * 0.4, color: i % 3 ? color : '#fff4c5', size: i % 3 + 2 });
    }
  }
  function popup(x, y, text) { popups.push({ x, y, text, life: 1.2 }); }
  function startLevel(index) {
    if (index >= save.unlocked) return;
    dialog.close(); $('screen-overlay').hidden = true; $('home-screen').hidden = true;
    $('hud').hidden = false; $('touch-controls').hidden = false; $('boss-hud').hidden = true; $('fullscreen-button').hidden = false;
    frame.classList.add('is-playing');
    level = O.createLevel(index); player = O.createPlayer();
    scene = 'playing'; camera = 0; elapsed = 0; sceneTime = 0; levelTime = 0;
    hearts = 3; score = 0; collected = 0; checkpoint = 100; particles = []; popups = []; accumulator = 0;
    sound.unlock(); sound.playing = true; sound.theme = index;
    clearInput(); resize(); updateHud();
    toast(index === 0 ? 'Вперёд, за мороженым! Стрелки — идти, пробел — прыгать.' : level.theme.subtitle, 5);
    canvas.focus({ preventScroll: true }); frame.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  function home() {
    scene = 'home'; sound.playing = false; clearInput();
    $('screen-overlay').hidden = true; $('hud').hidden = true; $('boss-hud').hidden = true;
    $('touch-controls').hidden = true; $('level-toast').hidden = true; $('home-screen').hidden = false; $('fullscreen-button').hidden = true;
    frame.classList.remove('is-playing', 'immersive');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    resize(); renderWorlds(); $('start-button').focus({ preventScroll: true });
  }
  function showScreen(kicker, title, description, actions, symbol = '✦', stats = []) {
    priorFocus = document.activeElement;
    $('screen-kicker').textContent = kicker; $('screen-title').textContent = title;
    $('screen-description').textContent = description; $('screen-symbol').textContent = symbol;
    $('screen-stats').replaceChildren();
    for (const [value, label] of stats) {
      const div = document.createElement('div'); div.className = 'stat';
      const strong = document.createElement('strong'); strong.textContent = value;
      div.append(strong, document.createTextNode(label)); $('screen-stats').append(div);
    }
    $('screen-actions').replaceChildren();
    actions.forEach(([text, callback], i) => {
      const button = document.createElement('button'); button.textContent = text;
      button.className = i === 0 ? 'primary-button' : i === actions.length - 1 ? 'text-button' : 'secondary-button';
      button.addEventListener('click', callback); $('screen-actions').append(button);
    });
    $('screen-overlay').hidden = false; $('touch-controls').hidden = true;
    clearInput(); sound.playing = false;
    $('screen-actions').querySelector('button').focus({ preventScroll: true });
    announce(`${title}. ${description}`);
  }
  function pause() {
    if (scene !== 'playing') return;
    scene = 'paused';
    showScreen('МАЛЕНЬКАЯ ПЕРЕДЫШКА', 'Мир подождёт', 'Пушистый друг немного отдыхает. Продолжим?',
      [['Продолжить приключение', resume], ['Начать уровень заново', () => startLevel(level.index)], ['К сладким мирам', home]], '☾');
  }
  function resume() {
    if (scene !== 'paused') return;
    scene = 'playing'; $('screen-overlay').hidden = true; $('touch-controls').hidden = false;
    sound.unlock(); sound.playing = true; accumulator = 0; clearInput();
    canvas.focus({ preventScroll: true });
  }
  function lose() {
    scene = 'lost'; sound.effect('hurt');
    showScreen('У ТЕБЯ ОБЯЗАТЕЛЬНО ПОЛУЧИТСЯ', 'Ещё одно приключение?', 'Мороженое в коллекции осталось. Давай попробуем снова!',
      [['Попробовать ещё раз · R', () => startLevel(level.index)], ['Выбрать мир', home]], '♡');
  }
  function finish() {
    if (scene !== 'playing') return;
    scene = 'won'; player.joy = 10; sound.effect('win');
    const stars = 1 + Number(collected >= Math.ceil(level.scoops.length * 0.6)) + Number(level.secret.found);
    save.unlocked = Math.max(save.unlocked, Math.min(5, level.index + 2));
    save.stars[level.index] = Math.max(save.stars[level.index], stars);
    save.best[level.index] = Math.max(save.best[level.index], score); persist(); renderWorlds();
    const final = level.index === 4;
    const actions = final ? [['Ещё раз в сладкие миры', home], ['Повторить праздник', () => startLevel(4)]] :
      [['В следующий мир →', () => startLevel(level.index + 1)], ['Собрать ещё мороженого', () => startLevel(level.index)], ['Выбрать мир', home]];
    showScreen(final ? 'ВОЛШЕБСТВО — ДЕЛИТЬСЯ' : 'ЕЩЁ ОДНО МАЛЕНЬКОЕ ЧУДО', final ? 'Мороженого хватит всем!' : 'Какое сладкое приключение!',
      final ? 'Король Пломбир стал вашим другом. Оливия и кот приглашают всех на большой праздник!' : `${level.theme.name} позади. Впереди — новый мир и новые друзья.`, actions,
      '★'.repeat(stars) + '☆'.repeat(3 - stars), [[score, 'очков'], [collected, 'мороженых'], [level.secret.found ? '1 / 1' : '0 / 1', 'секретов']]);
  }
  function hurt(fall = false, sourceX = player.x) {
    if (scene !== 'playing') return;
    if (player.hurt > 0 && !fall) return;
    hearts--; sound.effect('hurt'); updateHud();
    if (hearts <= 0) { lose(); return; }
    if (fall) {
      player = O.createPlayer(checkpoint); player.hurt = 2.4;
      camera = clamp(player.x - viewportWidth * 0.3, 0, level.width - viewportWidth);
      toast('Кот мягко приземлился у флажка. Попробуем ещё!', 3);
    } else {
      player.hurt = 2; player.vy = -310; player.vx = player.x < sourceX ? -180 : 180;
      player.grounded = false; player.coyote = 0; burst(player.x + 20, player.y + 24, '#f6d6bf', 9);
    }
  }
  function updateBoss(dt, previousBottom) {
    const b = level.boss;
    if (!b || b.won) return;
    if (!b.awake && player.x > level.width - 840) {
      b.awake = true; $('boss-hud').hidden = false;
      toast('Король зовёт поиграть! Перепрыгивай снежки и прыгай на корону, когда он присядет.', 5);
    }
    if (!b.awake) return;
    b.timer += dt; b.cooldown = Math.max(0, b.cooldown - dt);
    const crouch = b.timer % 5.6 > 2.8;
    b.crouch = crouch;
    if (!crouch && Math.floor(b.timer / 1.3) !== Math.floor((b.timer - dt) / 1.3)) {
      b.balls.push({ x: b.x - 45, y: 425, w: 17, h: 17, vx: -125 });
    }
    for (const ball of b.balls) {
      ball.x += ball.vx * dt;
      if (overlap(player, ball)) { hurt(false, ball.x); ball.x = -1000; }
    }
    b.balls = b.balls.filter(ball => ball.x > b.x - 750);
    const top = b.y - (crouch ? 90 : 140);
    if (player.x + player.w > b.x - 43 && player.x < b.x + 43 && player.y + player.h > top && player.y < b.y) {
      if (crouch && player.vy > 0 && previousBottom <= top + 16 && b.cooldown <= 0) {
        b.hp--; b.cooldown = 1.6; player.vy = -565; player.grounded = false; player.coyote = 0;
        sound.effect('bounce'); burst(b.x, top, '#f1ce80', 28); score += 300;
        $('boss-hearts').textContent = '✦ '.repeat(b.hp) + '· '.repeat(3 - b.hp);
        if (!b.hp) {
          b.won = true; b.balls = []; $('boss-hud').hidden = true;
          score += 1000; sound.effect('win'); toast('Ура! Король делится мороженым. Вперёд, к праздничным воротам!', 6);
        }
      } else if (b.cooldown <= 0) hurt(false, b.x);
    }
  }
  function update(dt) {
    if (scene !== 'playing') return;
    elapsed += dt; levelTime += dt;
    if (toastTime > 0) { toastTime -= dt; if (toastTime <= 0) $('level-toast').hidden = true; }
    for (const p of level.platforms) if (p.moving) {
      const oldX = p.x, oldY = p.y;
      p[p.axis] = (p.axis === 'x' ? p.baseX : p.baseY) + Math.sin(elapsed * 1.2 + p.phase) * p.amplitude;
      p.dx = p.x - oldX; p.dy = p.y - oldY;
    }
    const previousBottom = player.y + player.h;
    if (O.movePlayer(player, input, level.platforms, dt)) sound.effect('jump');
    input.jumpPressed = false;
    player.x = clamp(player.x, 0, level.width - player.w);
    if (player.y > 630) { hurt(true); return; }

    for (const scoop of level.scoops) if (!scoop.taken && overlap(player, { x: scoop.x - 16, y: scoop.y - 19, w: 32, h: 38 })) {
      scoop.taken = true; collected++; score += 100; player.joy = 0.5;
      sound.effect('scoop'); burst(scoop.x, scoop.y, A.palette[scoop.flavor], 9); popup(scoop.x, scoop.y - 20, '+100');
      if (!collectedIds.has(scoop.id)) {
        collectedIds.add(scoop.id); persist();
        const unlocked = outfits.find(o => o.cost === collectedIds.size);
        if (unlocked) toast(`Новый аксессуар: ${unlocked.name}! Загляни в гардероб.`, 4);
      }
    }
    const s = level.secret;
    if (!s.found && overlap(player, s)) {
      s.found = true; score += 500; burst(s.x + 15, s.y + 15, '#f2d78b', 25); popup(s.x, s.y, '+500');
      sound.effect('secret'); toast('Секрет найден! Волшебная звёздочка — твоя.', 4);
      for (let i = 0; i < 4; i++) level.scoops.push({ id: `${level.index}:${90+i}`, x: s.x - 45 + i * 35, y: 249, flavor: i, taken: false });
      lastHud = '';
    }
    for (const cp of level.checkpoints) if (!cp.active && player.x > cp.x) {
      cp.active = true; checkpoint = cp.x + 20; hearts = Math.min(3, hearts + 1);
      sound.effect('checkpoint'); toast('Контрольная точка! Кот отдохнул и восстановил сердечко.', 3);
    }
    for (const e of level.enemies) if (!e.gone) {
      e.x += e.dir * e.speed * dt;
      if (Math.abs(e.x - e.origin) > e.range) e.dir *= -1;
      e.y = 418 + ((e.kind === 'cloud' || e.kind === 'bird') ? Math.sin(elapsed * 2 + e.origin) * 12 - 27 : 0);
      if (overlap(player, e)) {
        if (player.vy > 40 && previousBottom <= e.y + 18) {
          e.gone = true; player.vy = -440; player.grounded = false; player.coyote = 0;
          score += 150; burst(e.x + 19, e.y + 15, '#eab8c9', 22); popup(e.x, e.y - 15, '+150'); sound.effect('bounce');
        } else hurt(false, e.x + e.w / 2);
      }
    }
    for (const h of level.hazards) {
      if (h.kind === 'wind') {
        if (player.x + player.w > h.x && player.x < h.x + h.w && player.y > 260 && player.y < 440) player.vy -= 2100 * dt;
      } else if (overlap(player, h)) hurt(false, h.x + h.w / 2);
    }
    for (const spring of level.springs) if (player.vy >= 0 && previousBottom <= spring.y + 16 && overlap(player, spring)) {
      player.vy = -790; player.grounded = false; player.coyote = 0; player.platform = null; sound.effect('bounce'); burst(spring.x + 19, spring.y, '#f1cf88', 8);
    }
    updateBoss(dt, previousBottom);
    if (scene !== 'playing') return;
    if (player.x > level.goal.x - 18) {
      if (!level.boss || level.boss.won) finish();
      else if (toastTime <= 0) toast('Сначала поиграй с Королём Пломбиром! Его корона светится, когда он приседает.', 4);
    }
    const target = clamp(player.x - viewportWidth * 0.33, 0, level.width - viewportWidth);
    camera += (target - camera) * (1 - Math.exp(-5 * dt));
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (const p of popups) { p.y -= 30 * dt; p.life -= dt; }
    popups = popups.filter(p => p.life > 0);
    updateHud();
  }

  function decoration(c, world, cam, t) {
    for (const ground of world.platforms.filter(p => p.ground)) {
      const begin = Math.max(ground.x + 30, Math.floor((cam - 80) / 90) * 90);
      for (let x = begin; x < Math.min(ground.x + ground.w - 20, cam + viewportWidth + 80); x += 90) {
        const n = Math.floor(x / 90);
        if (n % 3 === 0) A.flower(c, x, 448, n % 2 ? '#f7eac0' : '#eeb7ca', 1.2);
        else { A.rect(c, x, 440, 2, 8, world.theme.edge); A.rect(c, x - 4, 437, 2, 7, world.theme.grass); A.rect(c, x + 4, 438, 2, 7, world.theme.grass); }
      }
    }
    if (world.theme.type === 'cave') {
      for (let x = 230; x < world.width; x += 500) if (x > cam - 100 && x < cam + viewportWidth + 100) {
        A.poly(c, [[x,448],[x-14,413],[x-6,384],[x+9,408],[x+15,448]], '#b9a8d2');
        A.poly(c, [[x+3,448],[x+12,415],[x+29,404],[x+34,431],[x+21,448]], '#dbc1db');
        A.sparkle(c, x + 2, 409 + Math.sin(t * 2) * 4, '#f8e6b7');
      }
    } else if (world.theme.type !== 'cloud') {
      [250, 1575, 2340, 3160].forEach((x, i) => {
        if (x > cam - 130 && x < cam + viewportWidth + 130) A.tree(c, x, 448, 0.8 + i % 2 * 0.25, world.theme.type);
      });
    }
    if (world.index === 0) {
      A.rect(c, 155, 400, 5, 48, '#92775b'); A.rect(c, 128, 391, 62, 28, '#e8c896');
      A.rect(c, 133, 395, 52, 20, '#f3dfb3'); A.rect(c, 143, 403, 26, 3, '#7d8b61');
      A.poly(c, [[168,399],[176,405],[168,411]], '#7d8b61');
    }
  }
  function drawWorld(c, world, cam, time) {
    A.background(c, world.theme, cam, time);
    c.save(); c.translate(-Math.round(cam), 0);
    decoration(c, world, cam, time);
    for (const p of world.platforms) if (p.x + p.w > cam - 30 && p.x < cam + viewportWidth + 30) A.platform(c, p, world.theme);
    for (const h of world.hazards) {
      if (h.x < cam - 80 || h.x > cam + viewportWidth + 80) continue;
      if (h.kind === 'wind') {
        for (let i = 0; i < 5; i++) { c.globalAlpha = 0.5; A.cloud(c, h.x + h.w / 2 + Math.sin(time + i) * 15, 438 - (time * 65 + i * 30) % 160, 0.3, '#fffaf4'); c.globalAlpha = 1; }
      } else {
        const color = h.kind === 'cocoa' ? '#6c4655' : h.kind === 'caramel' ? '#bc8048' : h.kind === 'frost' ? '#90bed4' : '#cd8198';
        A.oval(c, h.x + h.w / 2, h.y + 2, h.w / 2, 6, color);
        for (let i = 0; i < 3; i++) A.rect(c, h.x + 8 + i * 13, h.y + Math.sin(time * 2 + i) * 2, 5, 2, '#f4cfbb');
      }
    }
    for (const spring of world.springs) {
      A.rect(c, spring.x + 9, spring.y + 9, 20, 10, '#a9845e');
      A.oval(c, spring.x + 19, spring.y + 5, 22, 10, '#e9b076'); A.rect(c, spring.x + 6, spring.y, 10, 3, '#ffe1a2');
    }
    for (const cp of world.checkpoints) {
      A.rect(c, cp.x, 378, 4, 70, '#f4ead1');
      A.poly(c, [[cp.x+4,380],[cp.x+39,386],[cp.x+4,403]], cp.active ? '#eaa3b7' : '#9ab69b');
      if (cp.active) A.sparkle(c, cp.x + 17, 388, '#fff6ca');
    }
    for (const s of world.scoops) if (!s.taken && s.x > cam - 20 && s.x < cam + viewportWidth + 20) A.iceCream(c, s.x, s.y + Math.sin(time * 2.5 + s.x) * 3, s.flavor, 1, time + s.x);
    if (!world.secret.found) {
      const s = world.secret;
      c.globalAlpha = 0.2; A.oval(c, s.x + 15, s.y + 12, 27, 27, '#fff0b1'); c.globalAlpha = 1;
      star(c, s.x + 15, s.y + 10 + Math.sin(time * 2) * 4, 15, '#f8d883');
      A.rect(c, s.x + 10, s.y + 9, 2, 3, '#a98561'); A.rect(c, s.x + 18, s.y + 9, 2, 3, '#a98561');
    }
    for (const e of world.enemies) if (!e.gone && e.x > cam - 50 && e.x < cam + viewportWidth + 50) A.enemy(c, e, time);
    if (world.boss) {
      const b = world.boss;
      if (b.crouch && !b.won) { c.save(); c.translate(0, b.y * 0.36); c.scale(1, 0.64); A.boss(c, b, time); c.restore(); A.sparkle(c, b.x, b.y - 103, '#fff4c0', 2); }
      else A.boss(c, b, time);
      for (const ball of b.balls) { A.oval(c, ball.x + 8, ball.y + 8, 10, 10, '#fff7e7'); A.rect(c, ball.x + 2, ball.y + 2, 5, 3, '#d5e0ea'); }
    }
    A.portal(c, world.goal.x, world.goal.y, time, !!world.boss && !world.boss.won);
    c.restore();
  }
  function star(c, x, y, radius, color) {
    const points = [];
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? radius * 0.48 : radius; points.push([Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r)]); }
    A.poly(c, points, color);
  }
  function drawHome(t) {
    const theme = O.themes[0];
    A.background(ctx, theme, 0, reducedMotion ? 0 : t * 0.35);
    A.tree(ctx, 828, 440, 1.5); A.tree(ctx, 529, 445, 0.8); A.lollipop(ctx, 943, 444, '#eab0be', 1.1);
    A.platform(ctx, { x: 0, y: 445, w: 960, h: 120, ground: true }, theme);
    for (let i = 0; i < 23; i++) A.flower(ctx, i * 43 + 15, 445, i % 2 ? '#fff1c0' : '#efb6c5', i % 3 ? 1 : 1.5);
    // A single oversized, animated portrait of the actual playable pair.
    A.oval(ctx, 701, 441, 102, 10, '#639160');
    A.rider(ctx, 690, 440, 2.6, { facing: 1 }, reducedMotion ? 0 : t, save.outfit);
    A.iceCream(ctx, 602, 240 + Math.sin(t * 1.5) * 5, 0, 1.6, t);
    A.iceCream(ctx, 832, 272 + Math.sin(t * 1.7) * 6, 1, 1.5, t + 1);
    A.iceCream(ctx, 760, 175 + Math.sin(t * 1.3) * 4, 2, 1.25, t + 2);
    A.sparkle(ctx, 565, 293, '#fff7d4', 2); A.sparkle(ctx, 796, 221, '#fff7d4', 2); A.sparkle(ctx, 873, 333, '#fff7d4', 2);
    A.enemy(ctx, { x: 880, y: 417, w: 38, h: 30, kind: 'snail', dir: -1 }, t);
    A.strawberry(ctx, 509, 444, 1.3); A.strawberry(ctx, 824, 446, 1.1);
  }
  function render() {
    ctx.imageSmoothingEnabled = false;
    if (scene === 'home') { drawHome(sceneTime); return; }
    drawWorld(ctx, level, camera, elapsed);
    ctx.save(); ctx.translate(-Math.round(camera), 0);
    if (!(player.hurt > 0 && Math.floor(player.hurt * 12) % 2)) {
      A.oval(ctx, player.x + 20, player.y + player.h + 1, 38, 5, '#4d6e5944');
      A.rider(ctx, player.x + 12, player.y + player.h - 2, 1.18, {
        facing: player.facing, run: player.grounded ? Math.abs(player.vx) / C.speed : 0,
        airborne: !player.grounded, landed: player.landed > 0, joy: player.joy > 0, victory: scene === 'won'
      }, elapsed, save.outfit);
    }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); A.rect(ctx, p.x, p.y, p.size, p.size, p.color); }
    ctx.globalAlpha = 1; ctx.font = 'bold 15px "Segoe UI",sans-serif'; ctx.textAlign = 'center';
    for (const p of popups) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = '#fffce8'; ctx.fillText(p.text, p.x + 1, p.y + 1); ctx.fillStyle = '#617952'; ctx.fillText(p.text, p.x, p.y); }
    ctx.globalAlpha = 1; ctx.restore();
    // Small progress line stays subtle and gives children a sense of distance.
    A.rect(ctx, 0, 536, viewportWidth, 4, '#ffffff30');
    A.rect(ctx, 0, 536, Math.round(viewportWidth * clamp(player.x / level.goal.x, 0, 1)), 4, '#f4ddb0');
  }
  function tick(ms) {
    const dt = Math.min(0.05, (ms - (previousTime || ms)) / 1000); previousTime = ms;
    if (!document.hidden) {
      sceneTime += dt;
      if (scene === 'playing') {
        accumulator += dt;
        while (accumulator >= C.step) { update(C.step); accumulator -= C.step; }
      } else accumulator = 0;
      sound.update(); render();
    }
    requestAnimationFrame(tick);
  }

  function preview(c, index) {
    const g = c.getContext('2d'); c.width = 240; c.height = 120; g.imageSmoothingEnabled = false;
    g.save(); g.scale(0.25, 0.25); g.translate(0, -30);
    A.background(g, O.themes[index], index * 215, 0);
    if (index === 0 || index === 1) A.tree(g, 640, 448, 1.5, O.themes[index].type);
    if (index === 2) { A.cloud(g, 500, 360, 2); A.lollipop(g, 770, 448, '#ceb8de', 1.5); }
    if (index === 3) for (let i = 0; i < 4; i++) A.poly(g, [[i*200+60,448],[i*200+100,270],[i*200+170,448]], '#b7a4cd');
    A.platform(g, { x: 0, y: 448, w: 960, h: 120, ground: true }, O.themes[index]);
    if (index === 0) A.rider(g, 280, 444, 1.4, {}, 0, save.outfit);
    A.iceCream(g, 440, 315, index % 4, 1.6); g.restore();
  }
  const lockSvg = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="9" width="10" height="8" rx="2"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>';
  function renderWorlds() {
    $('world-list').replaceChildren();
    O.themes.forEach((theme, index) => {
      const locked = index >= save.unlocked, button = document.createElement('button');
      button.className = `world-card${locked ? ' locked' : ''}${index === Math.min(4, save.unlocked - 1) ? ' active' : ''}`;
      button.disabled = locked;
      button.setAttribute('aria-label', `${index + 1}. ${theme.name}. ${locked ? 'Откроется после предыдущего мира' : 'Играть'}`);
      button.innerHTML = `<div class="world-preview"><canvas aria-hidden="true"></canvas><span class="world-number">0${index + 1}</span>${locked ? `<span class="world-lock">${lockSvg}</span>` : ''}</div><h3>${theme.name}</h3><small>${locked ? 'Впереди ещё столько чудес' : save.stars[index] ? 'Можно вернуться за секретами' : 'Приключение начинается'}<span class="world-state">${save.stars[index] ? '★'.repeat(save.stars[index]) : locked ? '' : '→'}</span></small>`;
      preview(button.querySelector('canvas'), index); button.addEventListener('click', () => startLevel(index)); $('world-list').append(button);
    });
    $('journey-count').textContent = `Открыт${save.unlocked > 1 ? 'о' : ''} ${save.unlocked} из 5 миров`;
    $('start-label').textContent = save.unlocked > 1 ? 'Продолжить приключение' : 'Начать приключение';
  }
  function openMenu(kind) {
    if (dialog.open) return;
    priorFocus = document.activeElement; dialogWasPlaying = scene === 'playing';
    if (dialogWasPlaying) { scene = 'paused'; sound.playing = false; clearInput(); }
    $('dialog-content').replaceChildren();
    if (kind === 'worlds') {
      $('dialog-title').textContent = 'Пять сладких миров'; $('dialog-kicker').textContent = 'МАЛЕНЬКИЕ БОЛЬШИЕ ПРИКЛЮЧЕНИЯ';
      O.themes.forEach((theme, i) => {
        const b = document.createElement('button'); b.className = 'dialog-world'; b.disabled = i >= save.unlocked;
        b.innerHTML = `<span class="world-medallion">0${i + 1}</span><span><strong>${theme.name}</strong><small>${i >= save.unlocked ? 'Пройди предыдущий мир, чтобы открыть' : theme.subtitle}</small></span><span class="world-state">${save.stars[i] ? '★'.repeat(save.stars[i]) : i >= save.unlocked ? '○' : '→'}</span>`;
        b.addEventListener('click', () => { dialogWasPlaying = false; startLevel(i); }); $('dialog-content').append(b);
      });
    } else if (kind === 'outfits') {
      $('dialog-title').textContent = 'Маленькие сокровища'; $('dialog-kicker').textContent = 'ГАРДЕРОБ ОЛИВИИ';
      const intro = document.createElement('p'); intro.className = 'outfit-intro';
      intro.textContent = `В коллекции ${collectedIds.size} мороженых. Аксессуары открываются сами — тратить ничего не нужно.`;
      const list = document.createElement('div'); list.className = 'outfits';
      outfits.forEach((outfit, i) => {
        const b = document.createElement('button'); b.className = `outfit${save.outfit === i ? ' selected' : ''}`;
        b.disabled = collectedIds.size < outfit.cost; b.setAttribute('aria-pressed', String(save.outfit === i));
        b.innerHTML = `<canvas width="150" height="150" aria-hidden="true"></canvas><strong>${outfit.name}</strong><small>${save.outfit === i ? 'Надето' : b.disabled ? outfit.hint : 'Надеть'}</small>`;
        const c = b.querySelector('canvas'), g = c.getContext('2d'); g.imageSmoothingEnabled = false; A.rider(g, 66, 137, 1.3, {}, 0, i);
        b.addEventListener('click', () => {
          save.outfit = i; persist(); renderWorlds();
          list.querySelectorAll('button').forEach((button, n) => { button.classList.toggle('selected', n === i); button.setAttribute('aria-pressed', String(n === i)); button.querySelector('small').textContent = n === i ? 'Надето' : button.disabled ? outfits[n].hint : 'Надеть'; });
        }); list.append(b);
      }); $('dialog-content').append(intro, list);
    } else {
      $('dialog-title').textContent = 'Всё начинается с прыжка'; $('dialog-kicker').textContent = 'КАК ИГРАТЬ';
      $('dialog-content').innerHTML = `<div class="help-body"><p>Оливия и её кот отправляются в пять сладких миров. Собирай мороженое, находи секретные звёзды и доберись до волшебных ворот.</p><div class="help-controls"><span><kbd>←</kbd> <kbd>→</kbd> Двигаться</span><span><kbd>Пробел</kbd> Прыгать</span><span><kbd>Esc</kbd> Пауза</span><span><kbd>R</kbd> Повтор уровня</span></div><p><strong>На телефоне</strong> используй кнопки внизу экрана. Для большого игрового поля поверни телефон горизонтально или нажми ⛶.</p><p><strong>Маленькие хитрости.</strong> Держи прыжок дольше, чтобы прыгнуть выше. На вафельные платформы можно запрыгнуть снизу. Прыгай сверху на забавных существ — они превратятся в конфетти. Обходи липкие лужицы.</p><p><strong>Три звезды:</strong> пройди мир, собери 60% мороженого, найди секретную звезду. Флажки сохраняют место внутри уровня и возвращают сердечко.</p><p><strong>Король Пломбир</strong> обожает играть! Перепрыгивай снежки и трижды прыгни на его сияющую корону, когда он присядет.</p><p>Новые мороженые навсегда попадают в коллекцию и открывают аксессуары. Повторный сбор даёт очки. Прогресс хранится в этом браузере; текущий уровень после закрытия начинается заново.</p></div>`;
    }
    dialog.showModal(); $('close-dialog').focus();
  }
  dialog.addEventListener('close', () => {
    if (dialogWasPlaying && scene === 'paused') { scene = 'playing'; sound.playing = true; accumulator = 0; clearInput(); canvas.focus({ preventScroll: true }); }
    else if (scene === 'playing') canvas.focus({ preventScroll: true });
    else if (priorFocus?.isConnected) priorFocus.focus({ preventScroll: true });
    dialogWasPlaying = false;
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) { const b = dialog.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close(); } });
  $('close-dialog').addEventListener('click', () => dialog.close());
  $('start-button').addEventListener('click', () => startLevel(Math.min(4, save.unlocked - 1)));
  $('worlds-nav').addEventListener('click', () => openMenu('worlds'));
  $('outfits-nav').addEventListener('click', () => openMenu('outfits'));
  $('help-button').addEventListener('click', () => openMenu('help'));
  $('pause-button').addEventListener('click', pause);
  $('sound-button').setAttribute('aria-pressed', String(save.sound));
  $('sound-button').setAttribute('aria-label', save.sound ? 'Выключить звук' : 'Включить звук');
  $('sound-button').addEventListener('click', () => {
    save.sound = !save.sound; sound.unlock(); sound.setEnabled(save.sound); persist();
    $('sound-button').setAttribute('aria-pressed', String(save.sound));
    $('sound-button').setAttribute('aria-label', save.sound ? 'Выключить звук' : 'Включить звук');
  });
  $('fullscreen-button').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.requestFullscreen) await frame.requestFullscreen();
      else frame.classList.toggle('immersive');
    } catch { frame.classList.toggle('immersive'); }
    resize();
  });
  document.addEventListener('fullscreenchange', resize);
  document.addEventListener('keydown', e => {
    if (dialog.open) return;
    if (e.code === 'Tab' && !$('screen-overlay').hidden) {
      const buttons = [...$('screen-actions').querySelectorAll('button')], first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (e.code === 'Escape') {
      if (e.repeat) return;
      if (scene === 'playing') { e.preventDefault(); pause(); }
      else if (scene === 'paused') { e.preventDefault(); resume(); }
      return;
    }
    if (e.code === 'KeyR' && ['playing', 'paused', 'lost', 'won'].includes(scene) && !e.repeat) { e.preventDefault(); startLevel(level.index); return; }
    if (scene !== 'playing' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(e.code)) {
      // Space still activates focused UI buttons; movement belongs to the game canvas.
      if (document.activeElement?.tagName === 'BUTTON' && e.code === 'Space') return;
      e.preventDefault(); keys.add(e.code); syncInput();
    }
  });
  document.addEventListener('keyup', e => { keys.delete(e.code); syncInput(); });
  document.querySelectorAll('[data-control]').forEach(button => {
    button.addEventListener('pointerdown', e => {
      e.preventDefault(); if (scene !== 'playing') return;
      button.setPointerCapture(e.pointerId); pointers.set(e.pointerId, button.dataset.control);
      button.classList.add('pressed'); syncInput(); sound.unlock();
    });
    const release = e => { pointers.delete(e.pointerId); if (![...pointers.values()].includes(button.dataset.control)) button.classList.remove('pressed'); syncInput(); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  });
  window.addEventListener('blur', () => { clearInput(); if (!dialog.open) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); if (!dialog.open) pause(); } previousTime = 0; });
  canvas.addEventListener('pointerdown', () => { sound.unlock(); canvas.focus({ preventScroll: true }); });

  // Read-only runtime snapshot for diagnostics; no cheats in the public controls.
  O.inspect = () => ({ scene, level: level?.index, player: player ? { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy, grounded: player.grounded,
      hurt: player.hurt, platform: player.platform ? { x: player.platform.x, y: player.platform.y, w: player.platform.w } : null } : null,
    hearts, score, collected, total: level?.scoops.length, camera, unlocked: save.unlocked, uniqueScoops: collectedIds.size,
    outfit: save.outfit, secret: level?.secret.found,
    enemies: level?.enemies.filter(e => !e.gone).map(e => ({ x: e.x, y: e.y, w: e.w, h: e.h })),
    boss: level?.boss ? { x: level.boss.x, hp: level.boss.hp, won: level.boss.won, crouch: level.boss.crouch, cooldown: level.boss.cooldown,
      balls: level.boss.balls.map(b => ({ x: b.x, y: b.y })) } : null, levelTime });
  renderWorlds(); resize(); requestAnimationFrame(tick);
})(window.Olivia);
