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
  // A fixed low-resolution backing canvas keeps every wave and sail a crisp pixel.
  const pixels = document.createElement('canvas'); pixels.width = 480; pixels.height = 270;
  const px = pixels.getContext('2d', { alpha: false });
  const palette = { sky: '#7eb9c9', cloud: '#f7e7bd', cloudShade: '#d8cfab', far: '#80a8ae', sea: '#397e94', deep: '#235971', foam: '#a9cbbc', wood: '#754e40', dark: '#362f39', sail: '#f7e4b3', shade: '#c9b78a' };
  function box(x, y, w, h, color) { px.fillStyle = color; px.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function shape(points, color) { px.beginPath(); points.forEach(([x, y], i) => i ? px.lineTo(Math.round(x), Math.round(y)) : px.moveTo(Math.round(x), Math.round(y))); px.closePath(); px.fillStyle = color; px.fill(); }
  function rope(points, color = '#584d42') { px.beginPath(); points.forEach(([x, y], i) => i ? px.lineTo(Math.round(x) + .5, Math.round(y) + .5) : px.moveTo(Math.round(x) + .5, Math.round(y) + .5)); px.strokeStyle = color; px.lineWidth = 1; px.stroke(); }
  function pixelCloud(x, y, scale = 1) {
    px.save(); px.translate(Math.round(x), Math.round(y)); px.scale(scale, scale);
    const contour = [[0, 11], [8, 11], [8, 5], [17, 5], [17, 0], [33, 0], [33, 4], [42, 4], [42, 8], [59, 8], [59, 14], [68, 14], [68, 21], [0, 21]];
    shape(contour, palette.cloudShade); shape(contour.map(([x, y]) => [x, y - 3]), palette.cloud);
    box(8, 15, 44, 2, '#fff1ca'); px.restore();
  }
  function sail(x, y, w, h, t, seed) {
    const billow = Math.round(Math.sin(t * 1.8 + seed) * 2);
    shape([[x - w / 2, y], [x + w / 2, y], [x + w / 2 - 3 + billow, y + h - 5], [x + 5, y + h], [x - w / 2 + 3 + billow, y + h - 3]], palette.sail);
    shape([[x + w / 2 - 8, y + 1], [x + w / 2, y], [x + w / 2 - 3 + billow, y + h - 5], [x + 5, y + h], [x + 8, y + h - 5]], palette.shade);
    box(x - w / 2 + 2, y + 3, w - 5, 1, '#fff1d0');
    for (let i = 1; i < 4; i++) rope([[x - w / 2 + i * w / 4, y + 2], [x - w / 2 + i * w / 4 + billow, y + h - 5]], '#dccda3');
    box(x - w / 2 - 3, y - 1, w + 6, 2, palette.dark);
  }
  function ship(t) {
    px.save(); px.translate(242, Math.round(190 + Math.sin(t * 1.3) * 2));
    // Bowsprit and rigging behind the canvas sails.
    rope([[-78, -21], [-114, -43]], palette.dark); rope([[-69, -15], [-112, -43]]);
    rope([[-114, -43], [-32, -119], [33, -136], [76, -93], [86, -7]]);
    rope([[-92, -10], [-32, -119], [29, -6]]); rope([[-59, -10], [33, -136], [90, -7]]);
    box(-34, -120, 3, 112, palette.wood); box(31, -136, 4, 130, palette.wood); box(74, -95, 3, 91, palette.wood);
    // High stern, dark keel, copper banding, and rows of cannon ports.
    shape([[-94, -15], [-75, -10], [59, -10], [59, -24], [89, -24], [94, 1], [77, 20], [-49, 20], [-72, 11]], palette.dark);
    shape([[-91, -15], [-71, -7], [60, -7], [60, -22], [87, -22], [88, 1], [75, 13], [-52, 13], [-71, 6]], palette.wood);
    shape([[-70, 6], [85, 6], [75, 16], [-49, 16]], '#553e38');
    box(-75, -8, 137, 3, '#b48a58'); box(59, -24, 30, 3, '#c1a06a'); box(-62, 3, 144, 2, '#aa7c4c');
    for (let i = 0; i < 11; i++) { box(-60 + i * 12, -3, 5, 4, '#262c34'); box(-58 + i * 12, -3, 2, 1, '#caab72'); }
    for (let i = 0; i < 4; i++) box(64 + i * 5, -18, 3, 5, '#e8c78b');
    box(-74, -14, 135, 2, '#e2bd7d'); box(58, -28, 31, 3, palette.wood);
    for (let i = 0; i < 15; i++) box(-72 + i * 9, -18, 1, 5, '#b69162');
    sail(-32, -109, 41, 26, t, 0); sail(-32, -75, 57, 40, t, 1);
    sail(33, -124, 37, 26, t, 2); sail(33, -90, 56, 31, t, 3); sail(33, -52, 65, 30, t, 4);
    sail(76, -83, 27, 27, t, 5); sail(76, -48, 31, 24, t, 6);
    // A simple red navigation cross on the main topsail.
    box(26, -82, 3, 16, '#a45742'); box(21, -77, 13, 3, '#a45742');
    shape([[-110, -41], [-36, -93], [-65, -29]], '#ead6a5');
    shape([[-108, -40], [-65, -29], [-70, -33]], '#bcad85');
    // Ratlines form visible ladders on either side of the main mast.
    for (let side of [-1, 1]) {
      rope([[33 + side * 3, -83], [33 + side * 22, -13]], '#685848');
      rope([[33 + side * 6, -83], [33 + side * 32, -13]], '#685848');
      for (let i = 0; i < 9; i++) { const q = i / 8; rope([[33 + side * (4 + 18 * q), -79 + i * 8], [33 + side * (7 + 24 * q), -79 + i * 8]], '#75624d'); }
    }
    const flap = Math.round(Math.sin(t * 3.8) * 2);
    shape([[35, -136], [55, -133 + flap], [49, -128 + flap], [35, -130]], '#a4523e');
    shape([[-31, -120], [-18, -117 - flap], [-23, -114 - flap], [-31, -116]], '#e7c578');
    box(32, -139, 2, 3, '#d8b576');
    px.restore();
  }
  function waveRow(y, depth, t, front = false) {
    for (let i = 0; i < 28; i++) {
      const seed = i + Math.floor(y) * 19;
      const speed = 4 + depth * 10;
      const x = ((random(seed) * 560 + t * speed) % 560) - 40;
      const yy = y + Math.round(Math.sin(t * 1.6 + i * .85 + y * .13) * (1 + depth * 2));
      const width = 4 + random(seed + 83) * (12 + depth * 17);
      box(x, yy, width, 1, front ? '#5ca0ad' : '#82b8b855');
      if (i % 4 === 0) { box(x + width * .2, yy - 1, width * .5, 1, front ? palette.foam : '#b7d1be'); box(x + width * .4, yy - 2, width * .2, 1, '#90bcb5'); }
    }
  }
  function scene(t) {
    box(0, 0, 480, 270, palette.sky);
    for (let i = 0; i < 9; i++) box(0, i * 15, 480, 15, `rgb(${126 + i * 4}, ${185 + i * 2}, ${201 - i * 2})`);
    // Stepped sun, clouds, and distant island coastlines.
    box(371, 22, 20, 36, '#f2dfab'); box(363, 29, 36, 22, '#f2dfab'); box(366, 25, 30, 30, '#f2dfab');
    pixelCloud(((t * 1.8 + 30) % 620) - 90, 32, 1.25); pixelCloud(((t * 1.2 + 207) % 620) - 90, 19, .8); pixelCloud(((t * 1.4 + 456) % 620) - 90, 67, 1);
    shape([[0, 126], [0, 105], [19, 105], [19, 98], [32, 98], [32, 87], [44, 87], [44, 79], [54, 79], [54, 94], [76, 94], [76, 104], [97, 104], [97, 116], [126, 116], [126, 126]], palette.far);
    shape([[400, 128], [420, 116], [435, 116], [435, 107], [453, 107], [453, 102], [472, 102], [472, 108], [480, 108], [480, 130]], '#92afaa');
    box(0, 126, 480, 144, palette.sea); box(0, 126, 480, 1, '#c4d4b8');
    for (let y = 132; y < 270; y += 9) waveRow(y, (y - 126) / 144, t);
    // A distant companion vessel on the horizon.
    const farX = Math.round(391 + Math.sin(t * .06) * 12);
    box(farX, 134, 21, 3, '#547477'); box(farX + 10, 115, 1, 19, '#698381');
    shape([[farX + 11, 116], [farX + 20, 129], [farX + 11, 129]], '#dfdbb5'); shape([[farX + 9, 120], [farX + 2, 130], [farX + 9, 130]], '#ced4b4');
    // Broken reflections follow the ship's gentle roll on the swell.
    for (let i = 0; i < 14; i++) {
      const y = 208 + i * 3, x = 223 + Math.sin(t * 1.6 + i) * 10;
      box(x - 48 + i * 2, y, 99 - i * 4, 1, i % 2 ? '#c5b59120' : '#162f4645');
    }
    ship(t);
    for (let y = 212; y < 270; y += 10) waveRow(y, (y - 126) / 144, t, true);
    const bob = Math.round(Math.sin(t * 1.3) * 2);
    for (let i = 0; i < 16; i++) {
      const q = (i / 16 + t * .35) % 1, x = 153 + q * 192, y = 207 + Math.sin(q * 12 + t * 2) * 2 + bob;
      box(x, y, 2 + random(i) * 5, 1, '#d5dfc3');
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.round(((random(i + 120) * 540 + t * (3 + i * .3)) % 540) - 30), y = Math.round(47 + i * 9 + Math.sin(t * .8 + i) * 3);
      const wing = Math.round(Math.sin(t * 4 + i));
      box(x, y, 1, 1, '#465f69'); box(x - 2, y - wing, 2, 1, '#465f69'); box(x + 1, y - wing, 2, 1, '#465f69');
    }
    // Scale directly in device pixels to avoid smoothing the pixel art.
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    const scale = Math.max(canvas.width / 480, canvas.height / 270);
    ctx.drawImage(pixels, Math.round((canvas.width - 480 * scale) / 2), Math.round((canvas.height - 270 * scale) / 2), Math.ceil(480 * scale), Math.ceil(270 * scale)); ctx.restore();
  }

  resize(); sync();
})();
