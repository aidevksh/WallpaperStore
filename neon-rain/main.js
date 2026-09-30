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
    rect(0,0,W,H,gradient('#10162b','#38304a'));
    glow(1060,370,430,'#a54c752f');glow(450,470,400,'#327c8740');
    for(let i=0;i<26;i++){let x=i*67-20,h=100+random(i)*250;rect(x,580-h,62,h,'#20253b');for(let j=0;j<9;j++)if(random(i*20+j)>.5)rect(x+13+(j%3)*16,590-h+Math.floor(j/3)*40,4,14,'#bbad7844');}
    const buildings=[];
    for(let i=0;i<12;i++){const x=i*145-30,h=210+random(i+90)*330;buildings.push({x,h});rect(x,700-h,125,h,i%2?'#171e32':'#192639');
      for(let row=0;row<Math.floor(h/34)-1;row++)for(let col=0;col<5;col++){let n=i*100+row*5+col;if(random(n)>.39)rect(x+13+col*22,720-h+row*31,8,13,random(n+60)>.7?'#ecb5a2':'#58959b');}
    }
    const signs=[[140,380,24,175,'#ed80b0'],[440,480,91,19,'#70d7d3'],[1054,330,25,209,'#a499e7'],[1330,492,98,22,'#ed9aab']];
    for(const [x,y,w,h,c] of signs){glow(x+w/2,y+h/2,130,c+'35');rect(x,y,w,h,c);rect(x+5,y+6,w-10,h-12,'#28314a');for(let j=0;j<(h>w?6:1);j++)rect(x+8,y+12+j*27,w-16,4,c);}
    rect(0,700,W,200,gradient('#1c3044','#151c32'));
    for(let i=0;i<180;i++){let x=random(i+44)*W,y=710+random(i+4)*185;let c= x<600?'#68c7ce':'#df81b7';ctx.globalAlpha=.08+random(i)*.25;rect(x+Math.sin(t*2+i)*5,y,12+random(i+70)*60,1+random(i+9)*3,c);}ctx.globalAlpha=1;
    for(let i=0;i<250;i++){const x=(random(i)*1800-t*65)%1800,y=(random(i+8)*1000+t*(270+random(i+3)*160))%1000;line([[x,y],[x-8,y+24]],'#b5d6ef38',1);}
    // An umbrella on the promenade anchors the city scale.
    line([[831,665],[831,742]],'#a1a6bc',3);ctx.beginPath();ctx.arc(830,669,53,Math.PI,TAU);ctx.fillStyle='#dda0a8';ctx.fill();
    rect(0,785,W,7,'#101b2a');line([[0,737],[W,737]],'#263e50',5);for(let x=30;x<W;x+=170)rect(x,737,5,50,'#263e50');
  }
})();
