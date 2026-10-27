(function (root) {
  'use strict';
  const themes = [
    { name: 'Клубничная поляна', subtitle: 'Там, где начинается маленькое чудо', label: 'КЛУБНИЧНЫЙ МИР', color: '#d86d79', sky: '#c8e9e7', far: '#b1d9bd', hill: '#82ba92', grass: '#71ad72', edge: '#426c50', soil: '#c99c76', shade: '#b17d61', accent: '#f28d9a', type: 'meadow' },
    { name: 'Карамельный лес', subtitle: 'По тропинкам сладкого янтаря', label: 'КАРАМЕЛЬНЫЙ МИР', color: '#ba7d3d', sky: '#f7dfb5', far: '#e2c09b', hill: '#b4bd85', grass: '#aeae68', edge: '#657346', soil: '#ce9861', shade: '#ad734b', accent: '#f0af5f', type: 'forest' },
    { name: 'Зефирные облака', subtitle: 'Выше облаков, ближе к мечте', label: 'ЗЕФИРНЫЙ МИР', color: '#8b79b5', sky: '#dcdcf3', far: '#cac4e2', hill: '#b7b6d4', grass: '#fbebed', edge: '#bba5c0', soil: '#d8b8cd', shade: '#bc99b8', accent: '#cda6da', type: 'cloud' },
    { name: 'Шоколадные пещеры', subtitle: 'Светлячки знают короткую дорогу', label: 'ШОКОЛАДНЫЙ МИР', color: '#ae8272', sky: '#453d58', far: '#5e4c65', hill: '#766078', grass: '#c78f85', edge: '#634f67', soil: '#9b736d', shade: '#795860', accent: '#f2c778', type: 'cave' },
    { name: 'Замок Пломбира', subtitle: 'Большой праздник для маленьких героев', label: 'ВАНИЛЬНЫЙ МИР', color: '#6f9c9b', sky: '#c8e5ed', far: '#b4d2df', hill: '#9ebcca', grass: '#f9f3dc', edge: '#8ca5ad', soil: '#c1cbd0', shade: '#a3afb9', accent: '#f1cf7d', type: 'castle' }
  ];
  function createLevel(index) {
    const theme = themes[index];
    const width = index === 4 ? 4380 : 3700 + index * 180;
    const platforms = [], scoops = [], enemies = [], hazards = [], springs = [];
    const ground = [[0, 660], [755, 1380], [1480, 2180], [2290, 2940], [3040, width]];
    ground.forEach(([x, end]) => platforms.push({ x, y: 448, w: end - x, h: 160, ground: true }));
    // All obligatory gaps <=110 px; full held jump travels ~225 px.
    const ledges = [[330, 365, 140], [520, 293, 118], [875, 366, 140], [1040, 286, 160],
      [1225, 355, 120], [1660, 365, 130], [1840, 290, 140], [2040, 365, 100],
      [2420, 365, 150], [2600, 285, 150], [2810, 360, 100], [3210, 365, 145], [3395, 290, 130]];
    ledges.forEach(([x, y, w]) => platforms.push({ x, y, w, h: 22 }));
    [[685, 389], [2190, 385], [2930, 372]].forEach(([x, y], i) => platforms.push({ x, y, baseX: x, baseY: y,
      w: 92, h: 22, moving: true, axis: i === 1 ? 'y' : 'x', amplitude: 32, phase: i * 2, dx: 0, dy: 0 }));
    let id = 0;
    for (const platform of platforms) {
      if (platform.moving) continue;
      const step = platform.ground ? 105 : 45;
      for (let x = platform.x + (platform.ground ? 130 : 28); x < platform.x + platform.w - 28; x += step) {
        if (index === 4 && x > width - 730) continue;
        scoops.push({ id: `${index}:${id++}`, x, y: platform.y - 39, flavor: id % 4, taken: false });
      }
    }
    const enemyKinds = [['snail', 'dog'], ['dog', 'snail'], ['cloud', 'bird'], ['snail', 'bird'], ['dog', 'cloud']][index];
    // Leave room to land after each creature before the next pit.
    [400, 1080, 1710, 2490, 3270].forEach((x, i) => enemies.push({ x, y: 448 - 30,
      w: 38, h: 30, origin: x, range: 42, dir: i % 2 ? -1 : 1, kind: enemyKinds[i % 2], speed: 20 + index * 3, gone: false }));
    [990, 1920, 2730].forEach((x, i) => hazards.push({ x, y: 440, w: index === 0 ? 42 : 54, h: 8,
      kind: index === 0 ? 'jam' : index === 1 ? 'caramel' : index === 2 ? 'wind' : index === 3 ? 'cocoa' : 'frost', phase: i }));
    if (index === 1) [440, 1570, 3140].forEach(x => springs.push({ x, y: 429, w: 38, h: 19 }));
    const secret = { x: 1110, y: 242, w: 30, h: 32, found: false };
    return { index, theme, width, platforms, scoops, enemies, hazards, springs, secret,
      checkpoints: [{ x: 1545, y: 448, active: false }, { x: 3100, y: 448, active: false }],
      goal: { x: width - 150, y: 448 },
      boss: index === 4 ? { x: width - 470, y: 448, hp: 3, phase: 0, cooldown: 0, timer: 0, balls: [], awake: false, won: false } : null };
  }
  const api = { themes, createLevel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else Object.assign(root.Olivia, api);
})(typeof globalThis !== 'undefined' ? globalThis : this);
