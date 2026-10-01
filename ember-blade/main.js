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
  let ready = false, fire = window.createBladeFire();
  background.onload = () => { ready = true; sync(); };
  background.src = 'background.png';
  function listenForRestore() {
    fire?.surface.addEventListener('fire-restored', () => { fire = window.createBladeFire(); listenForRestore(); sync(); });
  }
  listenForRestore();
  function scene(t) {
    rect(-400, -400, 2400, 1700, '#070a0e');
    if (!ready) return;
    ctx.drawImage(background, 0, 0, W, H);
    // Warm spill on the surrounding smoke follows the changing heat of the fire.
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .18 + Math.sin(t * 2.3) * .025;
    glow(640, 610, 320, '#ed451f55'); glow(1150, 290, 290, '#ed571844');
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (fire?.render(t)) ctx.drawImage(fire.surface, 0, 0, W, H);
    else {
      // Keep a live ember glow on machines without WebGL.
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .45 + Math.sin(t * 3) * .15;
      line([[107, 798], [1390, -3]], '#ff8b38', 3); line([[107, 798], [1600, 31]], '#ed6b26', 3);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 85; i++) {
      const life = (t * (.09 + random(i + 21) * .12) + random(i + 60)) % 1;
      const startX = 130 + random(i) * 1490;
      const edgeY = 798 - (startX - 107) * (i % 3 ? .624 : .514);
      const x = startX + Math.sin(life * 4 + i) * life * 65 - life * 25;
      const y = edgeY - life * (75 + random(i + 11) * 195);
      ctx.globalAlpha = Math.sin(life * Math.PI) * (.2 + random(i + 2) * .5);
      const radius = .45 + random(i + 8) * .9;
      ellipse(x, y, radius, radius * (1.3 + life), '#ffc375');
      if (i % 9 === 0) glow(x, y, 5, '#ff9b2833');
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  resize(); sync();
})();
