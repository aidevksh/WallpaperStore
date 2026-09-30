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
  function jelly(x,y,s,t,color) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);glow(0,0,140,color+'20');
    for(let k=0;k<9;k++){const pts=[];for(let j=0;j<=30;j++){let d=j/30;pts.push([(k-4)*13+Math.sin(d*7-t*1.2+k)*d*30,12+d*(170+Math.sin(k)*38)]);}line(pts,color+(k%2?'65':'a0'),k%2?1.2:2.5);}
    const pulse=1+Math.sin(t*1.5)*.055;
    ctx.beginPath();ctx.moveTo(-75*pulse,10);ctx.bezierCurveTo(-85,-90,85,-90,75*pulse,10);ctx.quadraticCurveTo(0,35,-75*pulse,10);const g=ctx.createLinearGradient(0,-60,0,30);g.addColorStop(0,color+'aa');g.addColorStop(1,color+'22');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=color+'bb';ctx.lineWidth=2;ctx.stroke();
    for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(0,-62);ctx.quadraticCurveTo(k*24,-30,k*26,15);ctx.strokeStyle=color+'40';ctx.stroke();}
    ellipse(0,-5,18,10,color+'88');ctx.restore();
  }
  function scene(t) {
    rect(0,0,W,H,gradient('#11374e','#040f25'));glow(720,-80,660,'#4797a02b');
    for(let i=0;i<5;i++)poly([[350+i*120,0],[415+i*125,0],[900+i*180,H],[600+i*170,H]],'#6bd2d805');
    for(let i=0;i<80;i++){let x=random(i)*W,y=(random(i+9)*1100-t*(6+random(i+5)*12)+11000)%1100-100;ctx.beginPath();ctx.arc(x,y,1+random(i+20)*3,0,TAU);ctx.strokeStyle='#9bd5d636';ctx.lineWidth=.8;ctx.stroke();}
    jelly(390+Math.sin(t*.2)*30,330+Math.sin(t*.5)*23,1.15,t,'#9adbdc');
    jelly(910+Math.sin(t*.15)*35,440+Math.sin(t*.4+1)*30,1.75,t+1,'#c3b1ed');
    jelly(1250+Math.sin(t*.17)*25,210+Math.sin(t*.6+2)*18,.7,t+2,'#e6b2d0');
    jelly(180,690+Math.sin(t*.5)*10,.4,t,'#80baca');jelly(1410,690+Math.sin(t*.4)*20,.5,t,'#80baca');
  }
})();
