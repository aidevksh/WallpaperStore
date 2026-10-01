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
  // Dense 960×540 pixel artwork, separate ship and scenery, with no interpolation.
  const pixels = document.createElement('canvas'); pixels.width = 960; pixels.height = 540;
  const px = pixels.getContext('2d', { alpha: false }); px.imageSmoothingEnabled = false;
  const background = new Image(), vessel = new Image();
  let ready = 0;
  for (const image of [background, vessel]) image.onload = () => { ready++; sync(); };
  background.src = 'background.png'; vessel.src = 'ship.png';
  function box(x, y, width, height, color) { px.fillStyle = color; px.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(width)), Math.max(1, Math.round(height))); }
  function ocean(t) {
    px.drawImage(background, 0, 0, 960, 540);
    const sx = background.width / 960, sy = background.height / 540;
    for (let y = 226; y < 540; y += 2) {
      const depth = (y - 226) / 314;
      const shift = Math.round((Math.sin(y * .059 - t * .75) * 3 + Math.sin(y * .021 + t * .43) * 2) * depth);
      const sourceY = Math.max(226, Math.min(537, y + Math.sin(y * .046 - t * .7) * depth * 2));
      // Wrapped horizontal scanlines create flowing swell without losing the fine pixel clusters.
      px.drawImage(background, 0, sourceY * sy, 960 * sx, 2 * sy, shift, y, 960, 2);
      if (shift > 0) px.drawImage(background, (960 - shift) * sx, sourceY * sy, shift * sx, 2 * sy, 0, y, shift, 2);
      if (shift < 0) px.drawImage(background, 0, sourceY * sy, -shift * sx, 2 * sy, 960 + shift, y, -shift, 2);
    }
  }
  function ship(t) {
    const width = 557, height = width * vessel.height / vessel.width;
    const heave = Math.round(Math.sin(t * 1.05) * 2 + Math.sin(t * .47) * 1.5);
    const x = 459 + Math.sin(t * .23) * 3, keel = 466 + heave;
    px.save(); px.translate(Math.round(x), keel); px.rotate(Math.sin(t * .78) * .008);
    // Draw the complete rigging in one pass so rotation cannot open seams between rows.
    px.drawImage(vessel, Math.round(-width / 2), Math.round(-height), width, height);
    px.restore();
    return { keel, heave };
  }
  function wake(t, keel) {
    // Broken cream and blue pixel clusters track the hull's waterline.
    for (let i = 0; i < 190; i++) {
      const life = (random(i + 510) + t * (.12 + random(i) * .1)) % 1;
      const x = 275 + random(i + 50) * 445 + life * 22;
      const y = keel - 7 + Math.sin((x - 270) / 445 * Math.PI) * 4 + random(i + 21) * 7 + Math.sin(t * 1.7 + i) * 1.5;
      px.globalAlpha = Math.sin(life * Math.PI) * (.25 + random(i + 100) * .6);
      box(x, y, 1 + random(i + 8) * 5, 1, i % 4 ? '#b9d0c7' : '#efdbb0');
    }
    px.globalAlpha = 1;
    // Foreground crests conceal the bottom pixels of the hull, seating it in the sea.
    const sy = background.height / 540;
    for (let x = 272; x < 710; x += 3) {
      const cut = Math.round(keel - 4 + Math.sin(x * .032 - t * .9) * 3);
      const height = Math.max(1, keel + 8 - cut);
      px.drawImage(background, x / 960 * background.width, cut * sy, 3 / 960 * background.width, height * sy, x, cut, 3, height);
      if (random(x) > .6) box(x, cut, 2, 1, '#a4c0bd');
    }
    for (let y = Math.round(keel + 5); y < 540; y += 2) {
      const shift = Math.round(Math.sin(y * .06 - t * .75) * 3);
      px.drawImage(background, 0, y * sy, background.width, 2 * sy, shift, y, 960, 2);
    }
  }
  function shimmer(t) {
    for (let i = 0; i < 160; i++) {
      const x = 776 + random(i + 234) * 178, y = 230 + random(i + 923) * 300;
      const depth = (y - 230) / 310, intensity = Math.max(0, Math.sin(t * (1 + random(i)) + i));
      px.globalAlpha = intensity * intensity * .3;
      box(x + Math.sin(t * .6 + i) * depth * 3, y, 1 + random(i) * 6 * depth, 1, '#ffdfa0');
    }
    px.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      const x = Math.round((680 + random(i + 31) * 390 + t * (2 + random(i))) % 1060 - 50);
      const y = Math.round(78 + random(i + 18) * 101 + Math.sin(t * .5 + i) * 3);
      const wing = Math.round(Math.sin(t * 3.6 + i));
      box(x, y, 1, 1, '#455767'); box(x - 2, y - wing, 2, 1, '#455767'); box(x + 1, y - wing, 2, 1, '#455767');
    }
  }
  function scene(t) {
    if (ready < 2) { rect(-400, -400, 2400, 1700, '#132a3a'); return; }
    px.globalAlpha = 1; ocean(t);
    const { keel } = ship(t); wake(t, keel); shimmer(t);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled = false;
    const scale = Math.max(canvas.width / 960, canvas.height / 540);
    ctx.drawImage(pixels, Math.round((canvas.width - 960 * scale) / 2), Math.round((canvas.height - 540 * scale) / 2), Math.ceil(960 * scale), Math.ceil(540 * scale));
    ctx.restore();
  }

  resize(); sync();
})();
