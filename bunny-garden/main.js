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
  function flower(x,y,s,t,color) {
    const sway=Math.sin(t+iSeed(x)) * 6*s;
    line([[x,y],[x+sway,y-45*s]],'#568a69',3*s);
    ellipse(x-7*s,y-19*s,12*s,4*s,'#7aaa75',-.5);
    for(let k=0;k<5;k++)ellipse(x+sway+Math.cos(k*TAU/5)*9*s,y-45*s+Math.sin(k*TAU/5)*9*s,8*s,8*s,color);
    ellipse(x+sway,y-45*s,5*s,5*s,'#efbe69');
  }
  function iSeed(x){return x*.01;}
  function bunny(x,y,s,t) {
    const hop=Math.max(0,Math.sin(t*1.7))*26;
    ellipse(x,y+10,68*s,13*s,'#74897126');
    ctx.save();ctx.translate(x,y-hop*s);ctx.scale(s,s);
    ellipse(49,-37,21,22,'#fff8ed');
    ellipse(0,-35,52,49,'#f8e9e0',-.1);
    ellipse(-29,1,28,13,'#fff8ef');ellipse(28,1,26,13,'#fff8ef');
    ellipse(-26,-141,14,48,'#fff8ef',-.2+Math.sin(t)*.05);ellipse(12,-143,15,50,'#fff8ef',.12);
    ellipse(-26,-142,7,33,'#eeb7ba',-.2);ellipse(12,-144,7,34,'#eeb7ba',.12);
    ellipse(-8,-88,49,43,'#fff8ef');
    const blink=Math.sin(t*.7)> .993;
    ellipse(-25,-91,3.6,blink?1:5,'#574c59');ellipse(10,-91,3.6,blink?1:5,'#574c59');
    ellipse(-36,-76,10,5,'#efbec4');ellipse(23,-76,10,5,'#efbec4');
    poly([[-12,-79],[-4,-79],[-8,-74]],'#d78f9c');line([[-8,-74],[-8,-69],[-14,-66]],'#9e7478',1.5);line([[-8,-69],[-2,-66]],'#9e7478',1.5);
    ctx.restore();
  }
  function scene(t) {
    rect(0,0,W,H,gradient('#bfe2df','#fff0d5'));
    glow(1200,150,220,'#fff7da');ellipse(1200,150,64,64,'#fff5ce');
    cloud(240+Math.sin(t*.07)*35,180,1.5,'#fff9ec');cloud(920+Math.sin(t*.06)*30,105,.8,'#fff9ec');cloud(1500,260,1.1,'#fff9ec');
    hill(510,65,'#adc8ac',1);hill(585,60,'#93b89a',3);hill(700,45,'#c7d6a4',.8);
    // A winding cream-colored garden path.
    ctx.beginPath();ctx.moveTo(1080,480);ctx.bezierCurveTo(640,620,1200,670,780,900);ctx.lineTo(1190,900);ctx.bezierCurveTo(1400,650,810,590,1110,480);ctx.fillStyle='#ece0b5';ctx.fill();
    for(let i=0;i<45;i++){let x=random(i+10)*W,y=650+random(i+40)*240;flower(x,y,.5+random(i+80)*.6,t,['#fff8e6','#f4c5c0','#ddcae4'][i%3]);}
    bunny(620,711,1.45,t);bunny(854,740,.86,t+1.5);
    for(let i=0;i<7;i++){const x=220+i*183+Math.sin(t*.6+i)*37,y=380+Math.cos(t*.8+i)*38;const flap=.25+Math.abs(Math.sin(t*5+i));ellipse(x-6,y,9*flap,13,'#eab2ac',-.4);ellipse(x+6,y,9*flap,13,'#fff0b0',.4);line([[x,y-5],[x,y+6]],'#947879',2);}
    hill(887,21,'#8fac85',3);
  }
})();
