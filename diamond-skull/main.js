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
  const background = new Image();
  let ready = false;
  background.onload = () => { ready = true; sync(); };
  background.src = 'background.png';
  // Highlights register against actual facets of the photographed crystal sculpture.
  const highlights = [[614,201],[680,103],[807,66],[915,120],[984,210],[1049,267],[572,305],[567,412],[648,462],[866,333],[934,424],[865,547],[763,605],[638,583],[605,711],[740,745],[861,742],[995,657],[1073,705],[1102,762],[963,779],[676,765],[536,663],[1023,409],[1060,523],[711,302]];
  function glint(x, y, intensity, size) {
    if (intensity < .015) return;
    ctx.globalAlpha = intensity;
    glow(x, y, size * 3.5, '#cef0ff40');
    ellipse(x, y, size * .22, size * .22, '#f4fbff');
    // Small optical diffraction streaks, rather than illustrated star icons.
    line([[x - size, y], [x + size, y]], '#edf8ff88', .65);
    line([[x, y - size * .72], [x, y + size * .72]], '#d8eaff77', .65);
  }
  function scene(t) {
    rect(-400, -400, 2400, 1700, '#070a10');
    if (!ready) return;
    ctx.drawImage(background, 0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    // Reflected softbox light breathes very gently over the gemstone's real refractions.
    ctx.globalAlpha = .035 + .015 * Math.sin(t * .6);
    glow(734, 266, 260, '#c5e8ff55'); glow(1006, 526, 165, '#a680df55');
    highlights.forEach(([x, y], i) => {
      const wave = Math.max(0, Math.sin(t * (.75 + random(i) * .4) + i * 2.27));
      glint(x, y, Math.pow(wave, 18) * (.3 + random(i + 8) * .45), 3 + random(i + 44) * 5);
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  resize(); sync();
})();
