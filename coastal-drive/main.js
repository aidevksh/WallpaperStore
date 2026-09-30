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
  function palm(x,y,s,t) {
    line([[x,y],[x-12*s,y-94*s],[x+6*s,y-203*s]],'#4c6763',14*s);
    for(let k=0;k<7;k++){let a=-Math.PI+k*Math.PI/6;const pts=[];for(let j=0;j<=12;j++){let q=j/12;pts.push([x+6*s+Math.cos(a)*100*s*q,y-203*s+Math.sin(a)*45*s*q+q*q*53*s+Math.sin(t+k)*q*3*s]);}line(pts,'#315c58',9*s);}
  }
  function scene(t) {
    rect(0,0,W,H,gradient('#8ed5de','#fff0ca',560));glow(1140,240,160,'#fff1bc');ellipse(1140,240,57,57,'#fff5cf');
    cloud(210,156,1.15,'#fff8e9');cloud(1360,116,.75,'#fff8e9');
    rect(0,395,W,505,gradient('#70c4ca','#237f96'));
    poly([[0,410],[210,330],[380,381],[610,400]],'#93b5b0');
    for(let i=0;i<70;i++){const y=415+random(i+22)*470,x=(random(i)*W+t*(5+random(i)*18))%W;line([[x,y],[x+12+random(i+9)*70,y]],i%4?'#b7e7db55':'#fff4d299',1+((y-415)/300));}
    poly([[929,402],[1025,440],[1230,550],[1600,680],[1600,900]],'#a4b995');
    poly([[930,402],[970,435],[1160,560],[1600,780],[1600,900]],'#dfd3ad');
    poly([[860,402],[944,402],[1600,900],[180,900]],'#e5d5ae');
    poly([[884,402],[929,402],[1520,900],[355,900]],'#626f74');
    line([[884,402],[355,900]],'#fff3d3',5);line([[929,402],[1520,900]],'#fff3d3',5);
    for(let i=0;i<17;i++){const z=((i/17+t*.14)%1);const z2=Math.min(1,z+.025);const y=402+z*z*498,y2=402+z2*z2*498;const x=906+32*z*z;line([[x,y],[906+32*z2*z2,y2]],'#ffe7ad',1+z*9);}
    // Roadside objects accelerate as they approach the viewer.
    for(let i=0;i<8;i++){const z=(i/8+t*.055)%1;const p=z*z;const y=402+p*550;palm(940+p*840,y,.07+p*1.8,t);}
    line([[865,422],[205,900]],'#f4e6c3',7);
    for(let i=0;i<14;i++){const z=(i/14+t*.12)%1,p=z*z;const x=865-660*p,y=422+478*p;line([[x,y],[x,y+6+38*p]],'#ecdebd',3+4*p);}
    for(let i=0;i<4;i++){const x=480+i*52+Math.sin(t*.5+i)*15,y=236+Math.sin(t*.7+i)*8;line([[x-12,y],[x,y+5],[x+12,y]],'#5d8994',2);}
  }
})();
