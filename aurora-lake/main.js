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
  function scene(t) {
    rect(0,0,W,H,gradient('#080f26','#2b5460',680));stars(t,140);
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let band=0;band<3;band++)for(let i=0;i<150;i++){
      let x=i*12-100,y=140+band*57+Math.sin(x/310+t*.18+band)*75+Math.cos(x/180-t*.1)*35;
      let g=ctx.createLinearGradient(x,y-60,x,y+210);g.addColorStop(0,'transparent');g.addColorStop(.45,['#6ee6b318','#79d5db14','#b394e714'][band]);g.addColorStop(.85,['#70edbf44','#65c9d630','#a495d933'][band]);g.addColorStop(1,'transparent');rect(x,y-60,13,270,g);
    }ctx.restore();
    const ridge=[[0,585],[100,490],[185,540],[330,338],[458,518],[570,425],[690,560],[864,388],[1010,514],[1180,352],[1330,520],[1450,465],[1600,568]];
    poly([...ridge,[W,720],[0,720]],'#203748');
    for(const [x,y] of [[330,338],[570,425],[864,388],[1180,352]])poly([[x-65,y+105],[x,y],[x+91,y+135],[x+17,y+90],[x-5,y+49],[x-25,y+95]],'#9bbec5');
    rect(0,620,W,280,gradient('#234958','#0c2435'));
    for(let i=0;i<90;i++){const y=632+i*3,x=800+Math.sin(i*.15+t*.3)*220,w=180+Math.sin(i*.1)*150;line([[x-w,y],[x+w,y]],i%3?'#70b3ac15':'#9ed2c92b',1);}
    for(let i=0;i<28;i++){let x=i<14?i*24:W-(i-14)*24,y=650+random(i)*65,s=.4+random(i+8)*.7;rect(x-3,y-80*s,6,100*s,'#0c202d');for(let k=0;k<3;k++)poly([[x,y-(140-k*30)*s],[x-30*s,y-(60-k*25)*s],[x+30*s,y-(60-k*25)*s]],'#0c202d');}
    hill(887,17,'#091c28',1);
  }
})();
