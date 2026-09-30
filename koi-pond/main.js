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
  function fish(x,y,s,a,t,color) {
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.scale(s,s);
    // Soft shadow under each koi.
    ellipse(7,15,63,17,'#143f4033');
    const tail=Math.sin(t*2.2)*10;
    poly([[-46,0],[-88,-23+tail],[-78,tail],[-88,23+tail]],'#e3dfc899');
    ellipse(-4,-19,22,9,'#ede8cb88',-.5);ellipse(-4,19,22,9,'#ede8cb88',.5);
    ellipse(0,0,56,20,'#eee8cd');ellipse(17,-3,18,14,color,.3);ellipse(-24,2,15,14,color,-.2);ellipse(37,0,10,15,color);
    ellipse(40,-10,2.5,2.5,'#283c3c');ellipse(40,10,2.5,2.5,'#283c3c');line([[-41,0],[24,0]],'#fff5dc77',1.5);ctx.restore();
  }
  function lily(x,y,r,a) {ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,a+.14,a+TAU-.14);ctx.closePath();ctx.fillStyle='#729778';ctx.fill();for(let i=1;i<8;i++){const b=a+i*TAU/8;line([[x,y],[x+Math.cos(b)*r*.85,y+Math.sin(b)*r*.85]],'#afbf8738',1);} }
  function scene(t) {
    rect(0,0,W,H,gradient('#345f62','#548477'));glow(1050,200,500,'#b0c8a22a');
    for(let i=0;i<40;i++){const x=random(i)*W,y=random(i+50)*H;ellipse(x,y,25+random(i+4)*40,10+random(i+2)*20,'#203e3c12',random(i)*TAU);}
    for(let i=0;i<6;i++){const a=t*.09+i*TAU/6,x=800+Math.cos(a)*(330+i*25),y=460+Math.sin(a)*(190+i*16);const heading=Math.atan2(Math.cos(a)*(190+i*16),-Math.sin(a)*(330+i*25));fish(x,y,.8+(i%3)*.23,heading,t+i,i%2?'#cc7457':'#d5ac5f');}
    for(let i=0;i<14;i++){const x=i<8?80+random(i)*400:1230+random(i)*350,y=random(i+80)*H;lily(x,y,30+random(i+6)*33,random(i)*TAU);if(i%5===0){for(let k=0;k<9;k++){let a=k*TAU/9;ellipse(x+Math.cos(a)*14,y+Math.sin(a)*14,16,7,'#ead3d2',a);}ellipse(x,y,8,8,'#e8c37d');}}
    for(let i=0;i<9;i++){const phase=(t*.14+i/9)%1;ctx.beginPath();ctx.ellipse(random(i+4)*W,random(i+15)*H,18+phase*105,8+phase*48,0,0,TAU);ctx.strokeStyle=`rgba(204,228,206,${(1-phase)*.2})`;ctx.lineWidth=1.2;ctx.stroke();}
    for(let i=0;i<25;i++){let x=random(i+20)*W,y=random(i+33)*H;line([[x,y],[x+25+Math.sin(t*.6+i)*15,y-3]],'#d9e2c41a',1);}
  }
})();
