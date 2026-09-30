/* Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0 */
(() => {
  'use strict';
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = 1600, H = 900, TAU = Math.PI * 2;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0, previous = 0, lastPaint = 0, frame = 0, paused = false, fps = 30;
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function gradient(top, bottom, y = H) { const g = ctx.createLinearGradient(0, 0, 0, y); g.addColorStop(0, top); g.addColorStop(1, bottom); return g; }
  function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function ellipse(x, y, rx, ry, color, angle = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, angle, 0, TAU); ctx.fillStyle = color; ctx.fill(); }
  function line(points, color, width = 1) { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke(); }
  function poly(points, color) { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();ctx.fillStyle=color;ctx.fill(); }
  function glow(x, y, radius, color) { const g=ctx.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');ellipse(x,y,radius,radius,g); }
  function cloud(x,y,s,color) { ellipse(x,y,90*s,23*s,color);ellipse(x-35*s,y-13*s,39*s,30*s,color);ellipse(x+15*s,y-25*s,48*s,43*s,color);ellipse(x+59*s,y-7*s,32*s,25*s,color); }
  function hill(y, amplitude, color, phase=0) { const pts=[[0,H]];for(let x=0;x<=W;x+=16)pts.push([x,y+Math.sin(x/350+phase)*amplitude+Math.cos(x/190+phase)*amplitude*.25]);pts.push([W,H]);poly(pts,color); }
  function stars(t, count=90) { for(let i=0;i<count;i++){ctx.globalAlpha=.3+.5*(.5+.5*Math.sin(t*.5+i));ellipse(random(i)*W,random(i+500)*H*.62,1+random(i+3)*1.1,1+random(i+3)*1.1,'#e6f5ff');}ctx.globalAlpha=1; }
  function draw(t) {
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    scene(t);
  }
  function resize() { const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);draw(time); }
  function running() { return !paused && !document.hidden && !motion.matches; }
  function tick(now) {
    frame=0;
    if(!running())return;
    if(previous)time+=Math.min((now-previous)/1000,.1);
    previous=now;
    if(now-lastPaint>=1000/fps-1){draw(time);lastPaint=now;}
    frame=requestAnimationFrame(tick);
  }
  function sync() { cancelAnimationFrame(frame);frame=0;previous=0;draw(time);if(running())frame=requestAnimationFrame(tick); }
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',sync);
  motion.addEventListener('change',sync);
  if(window.wallpaperJS?.on)window.wallpaperJS.on('lifecycle',event=>{paused=event.state==='paused';if(event.fps)fps=Math.max(1,Math.min(60,event.fps));sync();});
  resize();sync();
  function island(x,y,s,t) {
    ctx.save();ctx.translate(x,y+Math.sin(t*.4+x)*8);ctx.scale(s,s);
    poly([[-125,0],[120,0],[68,68],[10,130],[-40,80]],'#908099');poly([[-125,0],[-15,15],[10,130],[-40,80]],'#b297aa');poly([[-15,15],[120,0],[68,68],[10,130]],'#7f768f');
    ellipse(0,0,126,29,'#a6baa1');ellipse(-8,-6,107,19,'#c1cdb0');
    // Tiny cottage and a round tree.
    rect(-37,-49,48,44,'#fff0d5');poly([[-48,-48],[-14,-80],[25,-48]],'#b97d7d');rect(-18,-31,13,26,'#a38388');rect(-32,-39,9,11,'#9ac8cb');
    line([[63,-13],[63,-82]],'#8d7c83',7);ellipse(63,-88,29,35,'#91ac96');ellipse(48,-85,21,25,'#9fb69a');
    // Thin waterfall falling into the clouds.
    for(let k=0;k<6;k++)line([[31+k*2,12],[34+k*3+Math.sin(t*1.2+k)*3,175+k*8]],'#d6f2e34c',2);
    ctx.restore();
  }
  function scene(t) {
    rect(0,0,W,H,gradient('#a6bbd5','#f8cfb6'));ellipse(1230,190,80,80,'#ffe5c5');
    for(let i=0;i<9;i++){const x=(i*210+t*(3+i%3))%1900-150;cloud(x,210+(i%3)*105,.7+random(i)*.5,'#fff0e14a');}
    island(1040,375,.7,t+1);island(550,490,1.55,t);island(1320,660,.55,t+2);
    for(let i=0;i<8;i++)cloud((i*265+t*9)%2100-220,790+(i%2)*90,1.7,'#f9e4d5');
    const bx=1050+Math.sin(t*.2)*20,by=175+Math.sin(t*.5)*9;
    ellipse(bx,by,27,35,'#c1879c');ellipse(bx,by,12,35,'#e6b3b4');line([[bx-19,by+25],[bx-8,by+51],[bx+8,by+51],[bx+19,by+25]],'#947d92',1);rect(bx-9,by+47,18,13,'#a2818b');
  }
})();
