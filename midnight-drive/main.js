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
  const vanishing = { x: 783, y: 383 };
  const lamps = [[430,66,1],[605,211,.65],[663,278,.45],[1032,161,.6],[950,284,.4],[876,327,.25]];
  function roadPoint(z, offset) {
    const depth = z * z;
    return [vanishing.x + offset * depth, vanishing.y + 252 * depth];
  }
  function roadTexture(t) {
    ctx.save();
    // Only the asphalt flows forward. The skyline, guardrails, and dashboard stay sharp.
    ctx.beginPath(); ctx.moveTo(783, 397); ctx.lineTo(1490, 630); ctx.lineTo(208, 654); ctx.closePath(); ctx.clip();
    const phase = (t * .14) % 1;
    for (let layer = 0; layer < 2; layer++) {
      const q = (phase + layer * .5) % 1, scale = 1 + q * .19;
      ctx.globalAlpha = Math.sin(q * Math.PI) ** 2 * .58;
      ctx.drawImage(background, vanishing.x * (1 - scale), vanishing.y * (1 - scale), W * scale, H * scale);
    }
    ctx.restore();
  }
  function laneMarkers(t) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(783, 398); ctx.lineTo(1400, 636); ctx.lineTo(270, 651); ctx.closePath(); ctx.clip();
    for (const offset of [-251, 251]) for (let i = 0; i < 22; i++) {
      const z = (i / 22 + t * .13) % 1, end = Math.min(1, z + .014);
      const [x, y] = roadPoint(z, offset), [ex, ey] = roadPoint(end, offset);
      const width = .7 + z * z * 4, endWidth = .7 + end * end * 4;
      ctx.globalAlpha = .12 + z * .4;
      poly([[x-width,y],[x+width,y],[ex+endWidth,ey],[ex-endWidth,ey]], '#dddcd1');
      // Wet paint scatters a low, soft reflection down the road.
      ctx.globalAlpha *= .08;
      poly([[ex-endWidth,ey],[ex+endWidth,ey],[ex+endWidth*2,ey+4+z*12],[ex-endWidth*2,ey+4+z*12]], '#cee8f6');
    }
    ctx.restore();
  }
  function windshield(t) {
    // Tiny moving water beads refract the scene; most sit outside the central driving view.
    for (let i = 0; i < 42; i++) {
      const life = (random(i + 701) + t * (.018 + random(i) * .022)) % 1;
      const side = i % 2 ? 1 : -1;
      const x = side < 0 ? 40 + random(i + 61) * 250 : 1420 + random(i + 61) * 155;
      const y = 25 + life * 575, radius = 1.2 + random(i + 22) * 3.2;
      ctx.save(); ctx.globalAlpha = Math.sin(life * Math.PI) * .55;
      ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 1.35, -.12, 0, TAU); ctx.clip();
      ctx.drawImage(background, x / W * background.width - 5, y / H * background.height - 5, 10, 10, x - radius, y - radius * 1.35, radius * 2, radius * 2.7);
      ctx.restore();
      ctx.globalAlpha = Math.sin(life * Math.PI) * .28;
      line([[x-radius*.5,y-radius*.8],[x+radius*.3,y-radius]], side < 0 ? '#ffd39e' : '#b8d9e9', .7);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 55; i++) {
      const life = (random(i + 305) + t * .29) % 1;
      const x = random(i + 83) * W, y = life * 645;
      ctx.globalAlpha = .035 * Math.sin(life * Math.PI);
      line([[x, y], [x - 3, y + 8 + random(i) * 13]], '#a7c7db', .6);
    }
    ctx.globalAlpha = 1;
  }
  function scene(t) {
    rect(-400, -400, 2400, 1700, '#050810');
    if (!ready) return;
    ctx.drawImage(background, 0, 0, W, H);
    roadTexture(t); laneMarkers(t);
    // Passing amber light grazes the dashboard, with no artificial headlight polygon.
    ctx.globalCompositeOperation = 'screen';
    const warmth = .5 + .5 * Math.sin(t * 1.1);
    ctx.globalAlpha = .025 + warmth * .025; glow(1190, 774, 310, '#e7ad6740');
    for (let i = 0; i < lamps.length; i++) {
      const [x,y,s] = lamps[i];
      ctx.globalAlpha = .1 + .025 * Math.sin(t * .8 + i);
      glow(x, y, 22 * s, '#ffd6a175');
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    windshield(t);
  }

  resize(); sync();
})();
