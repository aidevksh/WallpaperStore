/* Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0 */
(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 1600, H = 900, TAU = Math.PI * 2;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0, previous = null, lastPaint = -Infinity, frame = 0, paused = false, fps = 30;
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function poly(points, color) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); }
  function line(points, color, width = 1) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
  function ellipse(x, y, rx, ry, color, angle = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, angle, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
  function gradient(x1, y1, x2, y2, stops) { const g = ctx.createLinearGradient(x1, y1, x2, y2); stops.forEach(([p, c]) => g.addColorStop(p, c)); return g; }
  function glow(x, y, radius, color) { const g = ctx.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, color.slice(0, 7) + '00'); ellipse(x, y, radius, radius, g); }
  function draw(t) {
    // Keep artwork proportional on wide screens; crop the edges on narrow displays.
    const scale = Math.max(canvas.width / W, canvas.height / H);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - W * scale) / 2, (canvas.height - H * scale) / 2);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    scene(t);
  }
  function resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5); canvas.width = Math.max(1, Math.round(innerWidth * dpr)); canvas.height = Math.max(1, Math.round(innerHeight * dpr)); draw(time); }
  function running() { return !paused && !document.hidden && !motion.matches; }
  function tick(now) {
    frame = 0;
    if (!running()) return;
    if (previous !== null) time += Math.min((now - previous) / 1000, .1);
    previous = now;
    if (now - lastPaint >= 1000 / fps - 1) { draw(time); lastPaint = now; }
    frame = requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(frame); frame = 0; previous = null; lastPaint = -Infinity; draw(time); if (running()) frame = requestAnimationFrame(tick); }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  if (window.wallpaperJS?.on) window.wallpaperJS.on('lifecycle', event => { paused = event.state === 'paused'; if (Number.isFinite(event.fps)) fps = Math.max(1, Math.min(60, event.fps)); sync(); });
  function bend(z, t) { return 800 + Math.sin(t * .09) * 140 * (1 - z) ** 2; }
  function roadPoint(z, side, t) { const p = z * z; return [bend(z, t) + side * (14 + 850 * p), 427 + 473 * p]; }
  function roadRibbon(left, right, color, t) {
    const points = [];
    for (let i = 0; i <= 60; i++) points.push(roadPoint(i / 60, left, t));
    for (let i = 60; i >= 0; i--) points.push(roadPoint(i / 60, right, t));
    poly(points, color);
  }
  function scene(t) {
    rect(-400, -400, 2400, 1700, gradient(0, 0, 0, H, [[0, '#040814'], [.43, '#172139'], [.58, '#242935'], [1, '#070b14']]));
    for (let i = 0; i < 130; i++) {
      ctx.globalAlpha = .25 + random(i) * .55 + Math.sin(t * .4 + i) * .12;
      ellipse(random(i + 33) * W, random(i + 99) * 325, i % 7 ? .85 : 1.45, i % 7 ? .85 : 1.45, '#c2d3ec');
    }
    ctx.globalAlpha = 1;
    glow(1174, 164, 180, '#9ebfeb15'); ellipse(1174, 164, 40, 40, '#dce5e6');
    ellipse(1163, 156, 4, 6, '#b9c7d4'); ellipse(1190, 169, 9, 7, '#c6d1db');
    // Mountain ridges bracket the glow of the distant city.
    const ridge = [[-400, 540]];
    for (let x = -400; x < 2100; x += 70) ridge.push([x, 355 + random(x + 7) * 73]);
    ridge.push([2100, 540]); poly(ridge, '#101828');
    glow(790, 408, 250, '#f6b87918'); glow(520, 411, 180, '#719adc15');
    for (let i = 0; i < 55; i++) {
      const x = 310 + i * 18, h = 10 + random(i + 2) * 66;
      rect(x, 435 - h, 12 + random(i + 3) * 9, h, '#101a29');
      for (let j = 0; j < h / 7; j++) if (random(i * 17 + j) > .52) rect(x + 3, 434 - j * 7, 2, 2, j % 3 ? '#e5b37890' : '#8aaccfa0');
    }
    rect(-400, 440, 2400, 460, '#0a111d');
    // Perspective ribbons follow the same gentle bend as the lane markers.
    roadRibbon(-1.4, 1.4, '#162032', t);
    roadRibbon(-1.12, 1.12, '#253044', t);
    roadRibbon(-1, 1, gradient(0, 430, 0, 900, [[0, '#29303e'], [1, '#151c29']]), t);
    roadRibbon(-1.015, -.995, '#a4b7c56b', t); roadRibbon(.995, 1.015, '#a4b7c56b', t);
    const headlights = ctx.createRadialGradient(800, 830, 10, 800, 820, 480);
    headlights.addColorStop(0, '#d6e6f430'); headlights.addColorStop(.55, '#cce1f71a'); headlights.addColorStop(1, '#cce1f700');
    poly([[650, 895], [600, 652], [695, 555], [904, 555], [1043, 652], [965, 895]], headlights);
    for (let lane of [-.34, .34]) for (let i = 0; i < 30; i++) {
      const z = (i / 30 + t * .105) % 1, z2 = Math.min(1, z + .012);
      const a = roadPoint(z, lane - .005, t), b = roadPoint(z, lane + .005, t);
      const c = roadPoint(z2, lane + .005, t), d = roadPoint(z2, lane - .005, t);
      poly([a, b, c, d], '#cdd6dc98');
    }
    // Low barriers, their reflectors, and paired street lamps rush past the car.
    for (const side of [-1, 1]) {
      const rail = [];
      for (let i = 0; i <= 40; i++) { const z = i / 40, p = roadPoint(z, side * 1.15, t); rail.push([p[0], p[1] - 3 - z * z * 22]); }
      line(rail, '#71879c62', 3);
      for (let i = 0; i < 24; i++) {
        const z = (i / 24 + t * .1) % 1, p = roadPoint(z, side * 1.15, t), s = z * z;
        line([[p[0], p[1]], [p[0], p[1] - 5 - s * 22]], '#40546d', 2 + s * 3);
        rect(p[0] - 1, p[1] - 5 - s * 22, 2 + s * 3, 2 + s * 3, side < 0 ? '#e9bc8399' : '#becee499');
      }
      for (let i = 0; i < 11; i++) {
        const z = (i / 11 + t * .045) % 1, p = roadPoint(z, side * 1.32, t), s = .06 + z * z;
        const y = p[1] - 240 * s, lx = p[0] - side * 60 * s;
        line([[p[0], p[1]], [p[0], y + 8 * s], [lx, y]], '#32445b', Math.max(1, 5 * s));
        line([[lx - 12 * s, y], [lx + 12 * s, y]], '#ffe1ac', 3 * s + 1);
        glow(lx, y, 48 * s + 3, '#ffc99140'); glow(lx, y, 17 * s + 1, '#ffe5b975');
        poly([[lx, y + 5], [lx - 75 * s, p[1]], [lx + 95 * s, p[1]]], '#eac89605');
      }
    }
    // Ahead: a car holding its lane, two red lamps reflected on the tarmac.
    const z = .29 + Math.sin(t * .21) * .013, car = roadPoint(z, 0, t), s = .42;
    ellipse(car[0], car[1] + 6, 52 * s, 9 * s, '#070b14');
    poly([[car[0] - 43 * s, car[1]], [car[0] - 38 * s, car[1] - 25 * s], [car[0] - 26 * s, car[1] - 43 * s], [car[0] + 26 * s, car[1] - 43 * s], [car[0] + 38 * s, car[1] - 25 * s], [car[0] + 43 * s, car[1]]], '#0b1425');
    for (const side of [-1, 1]) {
      const x = car[0] + side * 30 * s;
      glow(x, car[1] - 13 * s, 18, '#ff333357'); rect(x - 4, car[1] - 15 * s, 8, 3, '#ff6260');
      poly([[x - 3, car[1] + 4], [x + 3, car[1] + 4], [x + 16, car[1] + 57], [x - 16, car[1] + 57]], gradient(0, car[1], 0, car[1] + 57, [[0, '#ff4b392a'], [1, '#ff4b3900']]));
    }
    // A dark bonnet anchors the first-person driving view.
    poly([[125, 900], [301, 862], [578, 841], [1022, 841], [1299, 862], [1475, 900]], gradient(0, 843, 0, 900, [[0, '#15243a'], [1, '#030712']]));
    line([[309, 864], [578, 845], [1022, 845], [1291, 864]], '#7d9abd3b', 2);
    line([[517, 900], [578, 853]], '#293a5360', 2); line([[1083, 900], [1022, 853]], '#293a5360', 2);
    const vignette = ctx.createRadialGradient(800, 490, 240, 800, 490, 900);
    vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#000000ad'); rect(-400, -400, 2400, 1700, vignette);
  }

  resize(); sync();
})();
