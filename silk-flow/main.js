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
    rect(0,0,W,H,gradient('#121b31','#252137'));glow(420,390,550,'#70609925');glow(1200,660,450,'#b8746920');
    const palettes=[['#e6a994','#be7e9b'],['#adaddc','#737cc1'],['#88c3c6','#607aab']];
    for(let band=0;band<3;band++){
      for(let strand=0;strand<65;strand++){
        const pts=[];
        for(let x=-100;x<=W+100;x+=12){const u=x/W,spread=Math.sin(u*Math.PI)*95;const y=470+Math.sin(u*5+t*.18+band*1.2)*155+Math.cos(u*3-t*.13+band)*100+(strand/64-.5)*spread+band*12;pts.push([x,y]);}
        const g=ctx.createLinearGradient(0,0,W,H);g.addColorStop(0,palettes[band][0]+'14');g.addColorStop(.4,palettes[band][0]+'95');g.addColorStop(.75,palettes[band][1]+'b0');g.addColorStop(1,palettes[band][1]+'10');line(pts,g,.9);
      }
    }
    for(let i=0;i<50;i++){const x=random(i)*W,y=random(i+80)*H+Math.sin(t*.2+i)*10;ellipse(x,y,.7,.7,'#d0cae14d');}
  }
})();
