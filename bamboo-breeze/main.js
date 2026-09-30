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
    rect(0,0,W,H,gradient('#b8c8a7','#e2dfb8'));
    glow(1070,240,480,'#fff5c780');
    for(let layer=0;layer<3;layer++)for(let i=0;i<13;i++){
      const x=i*144+random(i+layer*41)*85-80,y=60+random(i+3)*130;
      const sway=Math.sin(t*.35+i)*7,wide=8+layer*5;
      const color=['#92ad9466','#648e7988','#315f55'][layer];
      line([[x,H],[x+sway,y]],color,wide);
      for(let j=0;j<7;j++){let yy=y+j*125;line([[x+sway-wide*.6,yy],[x+sway+wide*.6,yy]],['#b9c9a0','#9bb690','#639379'][layer],3);
        if(j%2===0){let direction=(i+j)%2?1:-1;line([[x,yy],[x+direction*95,yy-52]],color,2);
          for(let k=0;k<5;k++){const lx=x+direction*(20+k*17),ly=yy-12-k*8;ellipse(lx,ly,25+layer*3,4+layer,color,direction*(-.55-k*.15)+Math.sin(t*.6+i)*.05);ellipse(lx,ly+13,22,4,color,direction*.7);}}
      }
    }
    // Translucent shafts of afternoon light.
    poly([[890,0],[985,0],[590,900],[280,900]],'#ffffd512');poly([[1150,0],[1210,0],[940,900],[720,900]],'#ffffd51c');
    hill(846,25,'#315f5544');
    for(let i=0;i<24;i++){const x=(random(i)*1800+t*(12+random(i)*9))%1800-100,y=(random(i+30)*1000+t*15)%1000-50;ellipse(x,y,9,3,'#77905d',Math.sin(t+i));}
    for(let i=0;i<30;i++)ellipse(random(i+90)*W+Math.sin(t*.5+i)*14,random(i+60)*H,1.6,1.6,'#fff5cc88');
  }
})();
