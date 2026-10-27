(function (O) {
  'use strict';
  const palette = ['#f497aa', '#b9dfc0', '#edd6a2', '#b8b8e2'];
  function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); }
  function poly(c, points, color) {
    c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  }
  // Raster ellipses keep every edge on a pixel grid, even on Retina displays.
  function oval(c, x, y, rx, ry, color, pixel = 2) {
    for (let row = -ry; row <= ry; row += pixel) {
      const width = Math.round(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))) / pixel) * pixel;
      if (width) rect(c, x - width, y + row, width * 2, pixel, color);
    }
  }
  function cloud(c, x, y, size = 1, color = '#f7f9e9') {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(size, size);
    oval(c, 0, 0, 37, 13, color, 3); oval(c, -12, -10, 19, 18, color, 3); oval(c, 14, -6, 22, 20, color, 3); c.restore();
  }
  function sparkle(c, x, y, color = '#fff5d4', size = 1) {
    rect(c, x - size, y - 4 * size, 2 * size, 8 * size, color);
    rect(c, x - 4 * size, y - size, 8 * size, 2 * size, color);
  }
  function iceCream(c, x, y, flavor = 0, size = 1, time = 0) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale(size, size);
    poly(c, [[-7, 0], [7, 0], [2, 16], [-1, 18]], '#9e6f50');
    poly(c, [[-5, 1], [5, 1], [0, 14]], '#e5b879');
    rect(c, -3, 4, 7, 2, '#c6915f'); rect(c, -2, 9, 4, 2, '#c6915f');
    oval(c, 0, -5, 11, 10, '#9a6776'); oval(c, 0, -7, 10, 9, palette[flavor], 2);
    rect(c, -6, -13, 6, 3, '#fff2df'); rect(c, -9, -5, 4, 5, palette[flavor]); rect(c, 3, -4, 4, 6, palette[flavor]);
    rect(c, 4, -10, 2, 2, '#f8eacb');
    if (time && Math.sin(time * 3) > 0.65) sparkle(c, 16, -15, '#fff9db');
    c.restore();
  }
  function flower(c, x, y, color = '#f4c5cc', scale = 1) {
    rect(c, x, y - 8 * scale, 2 * scale, 10 * scale, '#54845d');
    rect(c, x - 4 * scale, y - 12 * scale, 10 * scale, 4 * scale, color);
    rect(c, x - scale, y - 15 * scale, 4 * scale, 10 * scale, color);
    rect(c, x, y - 11 * scale, 2 * scale, 3 * scale, '#f8dd8e');
  }
  function strawberry(c, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    poly(c, [[-12, -7], [-8, -13], [8, -13], [14, -5], [10, 5], [0, 14], [-10, 5]], '#aa596a');
    poly(c, [[-10, -7], [-6, -11], [7, -11], [11, -4], [6, 5], [0, 10], [-7, 3]], '#ed8c9b');
    rect(c, -7, -4, 2, 3, '#ffe9b9'); rect(c, 4, -3, 2, 3, '#ffe9b9'); rect(c, -1, 4, 2, 3, '#ffe9b9');
    poly(c, [[-2, -12], [-10, -18], [-3, -18], [0, -22], [3, -16], [10, -17], [6, -12]], '#5d8962'); c.restore();
  }
  function tree(c, x, y, scale = 1, type = 'meadow') {
    c.save(); c.translate(Math.round(x), y); c.scale(scale, scale);
    const caramel = type === 'forest';
    rect(c, -9, -80, 20, 82, '#957b63'); rect(c, -5, -80, 6, 80, '#b29b7b');
    rect(c, 6, -48, 10, 5, '#7e6c59'); rect(c, -19, -54, 15, 7, '#957b63');
    oval(c, -19, -92, 41, 37, caramel ? '#b47d55' : '#659b78', 4);
    oval(c, 25, -100, 42, 38, caramel ? '#d69a5d' : '#7db38c', 4);
    oval(c, 0, -130, 40, 36, caramel ? '#e5ad72' : '#8ac199', 4);
    oval(c, -18, -128, 23, 21, caramel ? '#edc38c' : '#a1d2a6', 4);
    oval(c, 24, -110, 25, 19, caramel ? '#e9b17a' : '#9acb9e', 4);
    for (let i = 0; i < 8; i++) rect(c, -38 + (i * 29 % 76), -139 + (i * 17 % 64), 5, 4, caramel ? '#f7d39b' : '#b9dab0');
    if (!caramel) { strawberry(c, -26, -86, 0.7); strawberry(c, 26, -116, 0.7); }
    else { oval(c, -22, -86, 7, 9, '#ffdc9a'); oval(c, 29, -126, 7, 9, '#ffdc9a'); }
    c.restore();
  }
  function lollipop(c, x, y, color = '#ebadb8', scale = 1) {
    c.save(); c.translate(x, y); c.scale(scale, scale);
    rect(c, -3, -75, 6, 75, '#ede5ce'); rect(c, 1, -75, 2, 75, '#c8bda7');
    oval(c, 0, -85, 29, 29, '#b47d87'); oval(c, 0, -87, 27, 27, color);
    oval(c, 0, -87, 18, 18, '#fff2da'); oval(c, 0, -87, 12, 12, color); oval(c, 0, -87, 6, 6, '#fff2da');
    rect(c, 0, -111, 4, 16, color); c.restore();
  }
  function rider(c, x, y, scale = 1, state = {}, t = 0, outfit = 0) {
    const run = state.run || 0, airborne = state.airborne || false;
    const bounce = run ? Math.sin(t * 16) * 1.4 : Math.sin(t * 2.6) * 0.7;
    c.save(); c.translate(Math.round(x), Math.round(y)); c.scale((state.facing || 1) * scale, scale);
    if (state.landed) c.scale(1.07, 0.91);
    if (state.victory) c.translate(0, -Math.abs(Math.sin(t * 6)) * 5);
    c.translate(0, Math.round(bounce));
    // All rider and cat parts share one transform: Olivia never detaches.
    const outline = '#514e4b', dark = '#77716a', mid = '#999184', light = '#b8af9c', cream = '#eee4cd';
    const tailLift = Math.round(Math.sin(t * 3) * 2);
    poly(c, [[-22,-17],[-36,-18],[-44,-26],[-48,-41 + tailLift],[-44,-49 + tailLift],[-36,-50 + tailLift],[-31,-45 + tailLift],[-33,-39],[-31,-32],[-22,-30]], outline);
    poly(c, [[-23,-20],[-35,-22],[-41,-29],[-45,-41 + tailLift],[-41,-46 + tailLift],[-36,-46 + tailLift],[-34,-43],[-37,-37],[-34,-29],[-22,-27]], mid);
    rect(c, -44, -40 + tailLift, 8, 5, dark); rect(c, -39, -29, 9, 4, dark);
    oval(c, -1, -22, 30, 20, outline); oval(c, -2, -23, 28, 18, mid);
    oval(c, -10, -26, 20, 13, light); oval(c, 18, -22, 13, 18, cream);
    // Tabby stripes and fluffy silhouette.
    poly(c, [[-20,-36],[-13,-37],[-10,-27],[-14,-25]], dark);
    poly(c, [[-7,-39],[0,-39],[2,-29],[-3,-26]], dark);
    poly(c, [[8,-36],[13,-33],[13,-27],[9,-25]], dark);
    rect(c, -29, -21, 3, 7, mid); rect(c, -25, -12, 5, 5, mid); rect(c, 11, -9, 6, 4, cream);
    const stride = airborne ? 3 : Math.round(Math.sin(t * 16) * run * 5);
    for (const [px, offset] of [[-19, stride], [-6, -stride], [16, -stride], [27, stride]]) {
      const py = airborne ? -8 + (px % 3) : -2 - Math.max(0, offset);
      rect(c, px, -14, 9, 14 + py, outline); rect(c, px + 1, -13, 7, 10 + py, mid);
      rect(c, px - 1, py - 3, 12, 5, cream); rect(c, px - 1, py + 2, 12, 2, outline);
    }
    // Big friendly face, upright ears, light muzzle.
    poly(c, [[10,-38],[10,-55],[15,-59],[24,-51],[33,-51],[41,-59],[46,-56],[46,-34]], outline);
    poly(c, [[13,-41],[13,-54],[16,-55],[24,-47],[34,-47],[42,-55],[43,-40]], light);
    poly(c, [[15,-51],[17,-53],[22,-47],[15,-45]], '#cd9a94');
    poly(c, [[36,-47],[41,-53],[42,-45]], '#cd9a94');
    oval(c, 28, -35, 22, 18, outline); oval(c, 28, -36, 20, 16, light);
    rect(c, 24, -50, 6, 8, dark); rect(c, 15, -46, 5, 5, dark); rect(c, 36, -46, 5, 5, dark);
    rect(c, 9, -35, 8, 3, dark); rect(c, 40, -35, 7, 3, dark);
    oval(c, 28, -27, 13, 9, cream); oval(c, 19, -34, 5, 5, '#dddfb2'); oval(c, 36, -34, 5, 5, '#dddfb2');
    const blink = Math.sin(t * 1.3) > 0.994;
    if (state.joy || state.victory) {
      rect(c, 16, -35, 7, 2, outline); rect(c, 33, -35, 7, 2, outline);
      rect(c, 16, -37, 2, 2, outline); rect(c, 38, -37, 2, 2, outline);
    } else {
      rect(c, 19, -37, 3, blink ? 2 : 7, '#3e4945'); rect(c, 36, -37, 3, blink ? 2 : 7, '#3e4945');
      if (!blink) { rect(c, 19, -37, 1, 2, '#fff9e8'); rect(c, 36, -37, 1, 2, '#fff9e8'); }
    }
    rect(c, 25, -29, 6, 3, '#ba7e82'); rect(c, 27, -26, 2, 3, outline);
    rect(c, 23, -23, 4, 2, outline); rect(c, 29, -23, 4, 2, outline);
    rect(c, 5, -29, 10, 1, cream); rect(c, 41, -28, 11, 1, cream); rect(c, 8, -25, 7, 1, cream);
    // Olivia: chestnut hair, dark travel suit, small boots.
    oval(c, -1, -65, 15, 17, '#5f443d');
    rect(c, -15, -63, 7, 24, '#725047'); rect(c, -14, -47, 7, 7, '#5f443d');
    rect(c, -6, -55, 15, 20, '#343f49'); rect(c, -3, -55, 5, 18, '#46505b');
    rect(c, 2, -38, 8, 17, '#2f3944'); rect(c, 4, -24, 12, 6, '#34323a'); rect(c, 5, -20, 11, 2, '#6b6260');
    rect(c, -6, -38, 11, 5, '#444b56');
    const waving = state.victory || state.joy;
    if (waving) {
      rect(c, 8, -55, 6, 10, '#343f49'); rect(c, 12, -65, 5, 15, '#343f49'); rect(c, 12, -69, 5, 5, '#efbe9f');
    } else {
      rect(c, 8, -52, 5, 12, '#343f49'); rect(c, 11, -43, 10, 4, '#343f49'); rect(c, 19, -43, 5, 4, '#efbe9f');
    }
    rect(c, -2, -59, 7, 6, '#e8ad91');
    oval(c, 0, -66, 11, 13, '#efbe9f'); oval(c, 2, -64, 9, 10, '#f4cbac');
    poly(c, [[-11,-65],[-13,-72],[-9,-79],[2,-81],[10,-76],[12,-68],[7,-70],[5,-75],[-1,-71],[-7,-71],[-8,-62]], '#795146');
    rect(c, -8, -77, 11, 3, '#916551'); rect(c, -9, -74, 5, 3, '#916551');
    rect(c, -3, -66, 2, 3, '#413c40'); rect(c, 5, -66, 2, 3, '#413c40');
    rect(c, -6, -61, 3, 2, '#df978d'); rect(c, 7, -61, 3, 2, '#df978d'); rect(c, 1, -59, 4, 1, '#b47270');
    rect(c, -13, -69, 4, 4, '#d9929b'); rect(c, -14, -70, 2, 6, '#efafba');
    if (outfit === 1 || outfit === 2) {
      const scarf = outfit === 1 ? '#e995a5' : '#98c9ac';
      rect(c, -5, -55, 15, 4, scarf); rect(c, -9, -54, 5, 11, scarf); rect(c, -13, -48, 7, 4, scarf);
    }
    if (outfit === 3) {
      poly(c, [[-10,-78],[-12,-88],[-6,-84],[0,-91],[5,-84],[11,-88],[9,-78]], '#c28b4d');
      poly(c, [[-8,-79],[-9,-85],[-5,-82],[0,-88],[4,-82],[8,-85],[7,-79]], '#f4d788');
      rect(c, -1, -83, 3, 3, '#e196a6');
    }
    c.restore();
  }
  function enemy(c, e, time) {
    c.save(); c.translate(Math.round(e.x + e.w / 2), Math.round(e.y + e.h)); c.scale(e.dir || 1, 1);
    const bob = Math.round(Math.sin(time * 5) * 2);
    if (e.kind === 'snail') {
      oval(c, 0, -7, 25, 8, '#a5ba8e'); oval(c, 5, -24, 17, 17, '#b58091');
      oval(c, 5, -26, 15, 14, '#ecc1cf'); oval(c, 5, -26, 9, 9, '#d38ea8'); oval(c, 5, -26, 4, 4, '#f7d5dd');
      rect(c, 18, -21, 2, 14, '#7e9d74'); rect(c, 25, -19, 2, 12, '#7e9d74');
      rect(c, 17, -23, 4, 4, '#485546'); rect(c, 24, -21, 4, 4, '#485546');
    } else if (e.kind === 'dog') {
      oval(c, -3, -17, 24, 15, '#deb388'); oval(c, 15, -30, 17, 16, '#efcf9b');
      oval(c, 5, -33, 7, 15, '#af826d'); rect(c, 26, -29, 6, 5, '#705b5b');
      rect(c, 17, -35, 3, 4, '#514e4b'); rect(c, -18, -5 - bob, 8, 6, '#deb388'); rect(c, 9, -5 + bob, 8, 6, '#deb388');
      rect(c, -29, -26, 12, 6, '#deb388'); iceCream(c, -4, -34, 1, 0.55);
    } else if (e.kind === 'cloud') {
      cloud(c, 0, -20 + bob, 0.6, '#f8e3e9'); rect(c, -9, -23 + bob, 3, 4, '#776379'); rect(c, 8, -23 + bob, 3, 4, '#776379');
      rect(c, -2, -15 + bob, 6, 2, '#bc8c9d');
    } else {
      oval(c, 0, -20 + bob, 20, 13, '#c5c1e1'); oval(c, -6, -16 + bob, 11, 7 + Math.abs(bob), '#9b9bc7');
      rect(c, 9, -25 + bob, 3, 4, '#514e62'); poly(c, [[17,-22+bob],[27,-19+bob],[17,-16+bob]], '#e9b879');
      rect(c, -8, -8 + bob, 2, 7, '#af8e75'); rect(c, 3, -8 + bob, 2, 7, '#af8e75');
    }
    c.restore();
  }
  function boss(c, b, time) {
    c.save(); c.translate(Math.round(b.x), b.y);
    if (b.cooldown > 0 && Math.floor(time * 10) % 2) c.globalAlpha = 0.65;
    const bob = Math.sin(time * 2) * 3;
    poly(c, [[-52,-78],[-72,-7],[66,-7],[51,-78]], '#b58ba2');
    poly(c, [[-45,-74],[-61,-10],[58,-10],[45,-74]], '#e2b1bf');
    oval(c, 0, -42 + bob, 49, 45, '#c3b9af'); oval(c, 0, -45 + bob, 47, 44, '#fff0d1');
    oval(c, -21, -80 + bob, 25, 24, '#fff5df'); oval(c, 17, -82 + bob, 28, 26, '#fff5df'); oval(c, 0, -100 + bob, 24, 20, '#fff5df');
    poly(c, [[-29,-109+bob],[-32,-137+bob],[-15,-124+bob],[0,-144+bob],[15,-124+bob],[31,-137+bob],[28,-109+bob]], '#bc9054');
    poly(c, [[-25,-112+bob],[-26,-130+bob],[-14,-119+bob],[0,-137+bob],[14,-119+bob],[26,-130+bob],[25,-112+bob]], '#f2d38c');
    rect(c, -3, -125 + bob, 7, 8, '#d58b9b');
    if (b.won) { rect(c, -24, -62, 12, 3, '#78655e'); rect(c, 14, -62, 12, 3, '#78655e'); }
    else { rect(c, -22, -68 + bob, 6, 10, '#78655e'); rect(c, 17, -68 + bob, 6, 10, '#78655e'); }
    oval(c, -31, -50 + bob, 9, 5, '#efb2b1'); oval(c, 32, -50 + bob, 9, 5, '#efb2b1');
    rect(c, -9, -43 + bob, 20, 4, '#b88685'); rect(c, -3, -39 + bob, 8, 3, '#b88685');
    oval(c, -45, -13, 16, 10, '#fff0d1'); oval(c, 42, -13, 16, 10, '#fff0d1'); c.restore();
  }
  function background(c, theme, camera, time) {
    rect(c, 0, 0, 960, 540, theme.sky);
    const night = theme.type === 'cave';
    if (night) {
      for (let i = 0; i < 25; i++) {
        const x = ((i * 157 - camera * 0.13) % 1060 + 1060) % 1060;
        c.globalAlpha = 0.3 + (Math.sin(time * 1.4 + i) + 1) * 0.25; sparkle(c, x, 40 + i * 67 % 275, '#f9d9a2', 1); c.globalAlpha = 1;
      }
      for (let i = 0; i < 10; i++) {
        const x = i * 150 - camera * 0.15 % 150;
        poly(c, [[x,0],[x+45,100+i%3*30],[x+90,0]], theme.far);
      }
    } else {
      oval(c, 770 - camera * 0.025, 93, 39, 39, '#f9efbe', 3);
      for (let i = 0; i < 7; i++) {
        const x = ((i * 192 + 70 - camera * 0.12 + time * 2) % 1260 + 1260) % 1260 - 100;
        cloud(c, x, 70 + i * 43 % 115, 0.8 + i % 3 * 0.23, '#f8f7e9');
      }
    }
    for (let layer = 0; layer < 2; layer++) {
      const spacing = layer ? 290 : 360;
      for (let i = -1; i < 6; i++) {
        const x = i * spacing - (camera * (layer ? 0.3 : 0.17)) % spacing;
        oval(c, x + spacing / 2, 410 + layer * 40, spacing * 0.78, 180 - layer * 30 + i % 2 * 30, layer ? theme.hill : theme.far, 5);
      }
    }
    if (theme.type === 'castle') {
      const bx = 720 - camera * 0.2 % 700;
      for (let i = 0; i < 3; i++) { rect(c, bx + i * 66, 180 - (i % 2) * 50, 57, 220, '#e6e3da');
        poly(c, [[bx+i*66-7,180-(i%2)*50],[bx+i*66+28,132-(i%2)*50],[bx+i*66+64,180-(i%2)*50]], '#b9c1d5');
        rect(c, bx + i * 66 + 22, 210 - (i % 2) * 50, 12, 25, '#a7bac8'); }
    }
    if (theme.type === 'cloud') {
      for (let i = 0; i < 7; i++) cloud(c, i * 190 - camera * 0.45 % 190, 395, 2.5, '#f0e5f0');
    } else if (!night) {
      for (let i = -1; i < 6; i++) {
        const x = i * 285 + 140 - (camera * 0.55) % 285;
        if (i % 2) tree(c, x, 430, 0.75, theme.type); else lollipop(c, x, 425, theme.accent, 0.8);
      }
    }
  }
  function platform(c, p, theme) {
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.ground) {
      rect(c, x, y + 12, p.w, p.h, theme.soil);
      rect(c, x, y + 18, p.w, 7, theme.shade);
      for (let tx = x + 8; tx < x + p.w - 6; tx += 28) {
        for (let ty = y + 37; ty < y + p.h; ty += 27) {
          rect(c, tx + (ty % 3) * 3, ty, 6, 4, theme.shade); rect(c, tx + 11, ty + 12, 4, 3, '#e2bb92');
        }
      }
      rect(c, x, y, p.w, 12, theme.grass); rect(c, x, y + 10, p.w, 4, theme.edge);
      for (let tx = x; tx < x + p.w - 4; tx += 14) {
        rect(c, tx, y - 3, 7, 4, theme.grass); rect(c, tx + 6, y + 11, 6, 6, theme.grass);
        if ((tx - x) % 42 === 0) rect(c, tx, y + 3, 10, 2, theme.type === 'cave' ? '#e7aaa0' : '#b3d299');
      }
    } else {
      rect(c, x + 4, y, p.w - 8, 22, '#9e7a65'); rect(c, x, y + 4, p.w, 12, '#c59c73');
      rect(c, x + 2, y, p.w - 4, 7, p.moving ? '#f1d7a1' : theme.accent);
      for (let tx = x + 8; tx < x + p.w - 6; tx += 13) { rect(c, tx, y + 9, 2, 10, '#e3bc86'); rect(c, tx - 3, y + 13, 10, 2, '#b98c61'); }
      if (p.moving) { rect(c, x + p.w / 2 - 9, y + 8, 18, 2, '#927957'); rect(c, x + p.w / 2 - 9, y + 6, 3, 6, '#927957'); rect(c, x + p.w / 2 + 6, y + 6, 3, 6, '#927957'); }
    }
  }
  function portal(c, x, y, t, locked = false) {
    rect(c, x - 45, y - 120, 10, 120, '#f3e4c9'); rect(c, x + 35, y - 120, 10, 120, '#f3e4c9');
    rect(c, x - 45, y - 122, 90, 12, '#b97c8e'); rect(c, x - 40, y - 119, 80, 10, '#eeb4c2');
    for (let i = 0; i < 4; i++) { rect(c, x - 45, y - 103 + i * 28, 10, 10, '#e5a6b7'); rect(c, x + 35, y - 103 + i * 28, 10, 10, '#e5a6b7'); }
    iceCream(c, x, y - 139, 2, 1.4, t);
    c.globalAlpha = locked ? 0.13 : 0.36; oval(c, x, y - 52, 32, 52, '#fff6d5'); c.globalAlpha = 1;
    if (!locked) for (let i = 0; i < 4; i++) sparkle(c, x + Math.sin(t + i * 2) * 23, y - 20 - (t * 20 + i * 25) % 86, '#fff7d7');
  }
  O.Art = { rect, poly, oval, cloud, sparkle, iceCream, flower, strawberry, tree, lollipop, rider, enemy, boss, background, platform, portal, palette };
})(window.Olivia);
