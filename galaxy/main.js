/* Copyright 2026 aidevksh; WallpaperJS contributors. SPDX-License-Identifier: Apache-2.0
 * Adapted from ASTRA: renamed to Galaxy and packaged for WallpaperStore. */
/* Galaxy. All artwork is generated locally, without external assets. */
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const DESIGN_WIDTH = 2560;
  const DESIGN_HEIGHT = 1440;
  const lockMode = new URLSearchParams(location.search).get('mode') === 'lock';
  document.documentElement.dataset.mode = lockMode ? 'lock' : 'desktop';
  const universe = document.getElementById('universe');
  const reactions = document.getElementById('reactions');
  const overlay = reactions.getContext('2d', { alpha: true });
  const bridge = window.wallpaperJS;
  const gl = universe.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  const settings = { audio: !lockMode, mouse: !lockMode, intensity: 0.8, color: '#ae9cff', fps: 30, rotationSpeed: 0.55, starBrightness: 0.8 };
  const audio = { bands: new Float32Array(64), target: new Float32Array(64), rms: 0, peak: 0, received: 0, lastAt: -Infinity };
  const pointer = { x: 0.5, y: 0.5, previousX: 0.5, previousY: 0.5, inside: false, received: 0, lastAt: -Infinity };
  const motes = [];
  const disposers = [];
  const moteSprites = [document.createElement('canvas'), document.createElement('canvas')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pixelRatio = 1, width = DESIGN_WIDTH, height = DESIGN_HEIGHT, designScale = 1;
  let paused = false, manuallyDriven = false, disposed = false, raf = 0, lastTick = 0, lastRenderedAt = 0, sceneTime = 0, renderedFrames = 0;
  let lastFrameCost = 0, rendererError = null, generatedParticles = 0;
  let overlayDirty = false, cloudFrame = -Infinity, cloudFrames = 0;
  let cloudTexture, cloudFramebuffer, cloudProgram, cloudQuad, cloudPosition, cloudWidth = 0, cloudHeight = 0;
  let randomState = 0x41535452;
  function random() {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
    return randomState / 4294967296;
  }
  function normal() { return Math.sqrt(-2 * Math.log(Math.max(0.000001, random()))) * Math.cos(TAU * random()); }
  function clamp(value, lo = 0, hi = 1) { return Math.min(hi, Math.max(lo, value)); }
  function lerp(a, b, amount) { return a + (b - a) * amount; }
  function accent(alpha = 1) {
    const hex = /^#[a-f\d]{6}$/i.test(settings.color) ? settings.color : '#ae9cff';
    return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;
  }
  function prepareMoteSprites() {
    for (let i = 0; i < moteSprites.length; i++) {
      const canvas = moteSprites[i]; canvas.width = canvas.height = 40;
      const context = canvas.getContext('2d');
      context.fillStyle = accent(0.76); context.shadowColor = accent(0.6); context.shadowBlur = 9;
      context.beginPath(); context.arc(20, 20, i ? 2 : 1.1, 0, TAU); context.fill();
      if (i) {
        context.fillStyle = 'rgba(228,241,255,0.64)';
        context.fillRect(15, 19.7, 10, 0.6); context.fillRect(19.7, 15, 0.6, 10);
      }
    }
  }

  // Each particle contains xyz, pixel size, rgb, opacity, phase, and sprite profile.
  function particle(list, x, y, z, size, color, opacity, kind = 0) {
    list.push(x, y, z, size, color[0], color[1], color[2], opacity, random() * TAU, kind);
  }
  function armPosition(radius, arm, scatter = 1) {
    const turn = Math.log(radius + 0.115) * 2.72;
    const width = (0.032 + radius * 0.10) * scatter;
    const angle = turn + arm * TAU / 3 + normal() * width / Math.max(radius, 0.1);
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, normal() * (0.007 + radius * 0.008)];
  }

  const layers = [];
  let program, positionLocation, sizeLocation, colorLocation, phaseLocation, kindLocation, uniforms;
  const vertexSource = `
    precision highp float;
    attribute vec3 aPosition;
    attribute float aSize;
    attribute vec4 aColor;
    attribute float aPhase;
    attribute float aKind;
    uniform vec2 uResolution;
    uniform float uScale;
    uniform float uPixelRatio;
    uniform float uTime;
    uniform float uRotation;
    uniform float uGalaxy;
    uniform float uBrightness;
    varying vec4 vColor;
    varying float vKind;
    void main() {
      vec2 screenPosition;
      float depth = 1.0;
      if (uGalaxy > 0.5) {
        float angle = uRotation + aPosition.z * 0.2;
        vec2 plane = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * aPosition.xy;
        vec2 tilted = vec2(plane.x, plane.y * 0.48 + aPosition.z * 0.87);
        float roll = -0.34;
        vec2 oriented = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * tilted;
        depth = 1.0 + plane.y * 0.09;
        screenPosition = vec2(1280.0, 666.0) + oriented * 885.0 * depth;
      } else {
        screenPosition = aPosition.xy;
      }
      vec2 pixel = (screenPosition - vec2(1280.0, 720.0)) * uScale + uResolution * 0.5;
      gl_Position = vec4(pixel.x / uResolution.x * 2.0 - 1.0, 1.0 - pixel.y / uResolution.y * 2.0, 0.0, 1.0);
      gl_PointSize = max(0.75, aSize * uScale * depth);
      float twinkle = 0.91 + 0.09 * sin(uTime * (0.16 + aPhase * 0.055) + aPhase * 3.0);
      vColor = vec4(aColor.rgb, aColor.a * mix(twinkle, 1.0, step(1.5, aKind)) * uBrightness);
      vKind = aKind;
    }
  `;
  const fragmentSource = `
    precision mediump float;
    varying vec4 vColor;
    varying float vKind;
    void main() {
      vec2 p = gl_PointCoord * 2.0 - 1.0;
      float d = dot(p,p);
      if (d > 1.0) discard;
      float light;
      if (vKind < 0.5) {
        light = exp(-d * 6.0) * 0.75 + exp(-d * 35.0) * 0.25;
      } else if (vKind < 1.5) {
        light = exp(-d * 22.0) + exp(-d * 5.0) * 0.13;
        float horizontal = exp(-abs(p.y) * 60.0) * exp(-abs(p.x) * 5.0);
        float vertical = exp(-abs(p.x) * 60.0) * exp(-abs(p.y) * 5.0);
        light += (horizontal + vertical) * 0.20;
      } else {
        light = exp(-d * 3.8) * pow(1.0 - d, 1.2);
      }
      gl_FragColor = vec4(vColor.rgb, vColor.a * light);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function addLayer(points, galaxy, brightness = 1, additive = true) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    layers.push({ buffer, count: points.length / 10, galaxy, brightness, additive });
    generatedParticles += points.length / 10;
  }
  function createUniverse() {
    if (!gl) throw new Error('WebGL is unavailable. Enable hardware acceleration to render ASTRA.');
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    positionLocation = gl.getAttribLocation(program, 'aPosition');
    sizeLocation = gl.getAttribLocation(program, 'aSize');
    colorLocation = gl.getAttribLocation(program, 'aColor');
    phaseLocation = gl.getAttribLocation(program, 'aPhase');
    kindLocation = gl.getAttribLocation(program, 'aKind');
    uniforms = Object.fromEntries(['Resolution', 'Scale', 'PixelRatio', 'Time', 'Rotation', 'Galaxy', 'Brightness'].map(name => [name, gl.getUniformLocation(program, `u${name}`)]));
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    // The broad gas and dust are soft by design. Cache them at half resolution;
    // crisp stars and responsive input still render at the requested frame rate.
    cloudTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    cloudFramebuffer = gl.createFramebuffer();
    cloudProgram = gl.createProgram();
    gl.attachShader(cloudProgram, compile(gl.VERTEX_SHADER, 'attribute vec2 aPosition; varying vec2 vUV; void main(){vUV=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.0,1.0);}'));
    gl.attachShader(cloudProgram, compile(gl.FRAGMENT_SHADER, 'precision mediump float; uniform sampler2D uTexture; varying vec2 vUV; void main(){gl_FragColor=texture2D(uTexture,vUV);}'));
    gl.linkProgram(cloudProgram);
    if (!gl.getProgramParameter(cloudProgram, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(cloudProgram));
    cloudPosition = gl.getAttribLocation(cloudProgram, 'aPosition');
    cloudQuad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cloudQuad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // Distant, fixed stars span a larger area to cover ultrawide and portrait crops.
    const background = [];
    for (let i = 0; i < 3100; i++) {
      const x = -450 + random() * 3460, y = -280 + random() * 2000;
      const luminous = random();
      const hue = random();
      const color = hue < 0.30 ? [0.63, 0.76, 1] : hue < 0.87 ? [0.85, 0.87, 1] : [1, 0.80, 0.67];
      particle(background, x, y, 0, luminous > 0.983 ? 18 + random() * 20 : 1.1 + Math.pow(random(), 3) * 5, color, luminous > 0.983 ? 0.74 : 0.16 + random() * 0.48, luminous > 0.983 ? 1 : 0);
    }
    addLayer(background, false);

    // Broad atmospheric pockets soften the transition from deep space into the disk.
    const atmosphere = [];
    for (let i = 0; i < 900; i++) {
      const radius = Math.pow(random(), 0.65) * 1.09;
      const [x, y, z] = armPosition(radius, i % 3, 2.5);
      const color = i % 3 === 0 ? [0.24, 0.20, 0.62] : [0.17, 0.35, 0.63];
      particle(atmosphere, x, y, z, 150 + random() * 220, color, 0.019 * (1 - radius * 0.4), 2);
    }
    addLayer(atmosphere, true);

    // Warm central bulge, cold spiral nebulae, and irregular ionized gas knots.
    const nebulae = [];
    particle(nebulae, 0, 0, 0, 280, [0.66, 0.59, 0.98], 0.32, 2);
    particle(nebulae, 0, 0, 0, 150, [1, 0.88, 0.75], 0.55, 2);
    particle(nebulae, 0, 0, 0, 62, [1, 0.96, 0.87], 0.8, 2);
    for (let i = 0; i < 14500; i++) {
      const radius = 0.035 + Math.pow(random(), 0.61) * 0.99;
      const arm = i % 3;
      const [x, y, z] = armPosition(radius, arm, 1.0);
      const warm = Math.exp(-radius * 6.5);
      const knot = 0.5 + 0.5 * Math.sin(radius * 52 + arm * 2.1);
      const violet = 0.5 + 0.5 * Math.sin(radius * 15 + arm * 2.5);
      const color = [lerp(0.31 + violet * 0.22, 1.0, warm), lerp(0.48, 0.80, warm), lerp(0.93, 0.69, warm)];
      const edgeFade = clamp((1.04 - radius) / 0.20);
      particle(nebulae, x, y, z, 15 + random() * 60 + (1 - radius) * 16, color, (0.025 + knot * 0.020) * (1.02 - radius * 0.4) * edgeFade, 2);
    }
    for (let i = 0; i < 2200; i++) {
      const radius = Math.pow(random(), 1.55) * 0.26;
      const angle = random() * TAU;
      particle(nebulae, Math.cos(angle) * radius, Math.sin(angle) * radius, normal() * Math.min(0.018, radius * 0.38), 20 + random() * 58, [0.96, 0.85, 0.74], 0.028, 2);
    }
    for (let i = 0; i < 1400; i++) {
      const radius = Math.pow(random(), 0.9) * 0.78, angle = random() * TAU;
      particle(nebulae, Math.cos(angle) * radius, Math.sin(angle) * radius, normal() * radius * 0.02, 45 + random() * 75, [0.43, 0.45, 0.69], 0.025 * (1 - radius * 0.6), 2);
    }
    addLayer(nebulae, true);

    // Translucent dust lanes break up the smooth gas, revealing the spiral structure.
    const dust = [];
    for (let i = 0; i < 5800; i++) {
      const radius = 0.12 + Math.pow(random(), 0.63) * 0.86;
      const arm = i % 3;
      const angle = Math.log(radius + 0.115) * 2.72 + arm * TAU / 3 + 0.13 + Math.sin(radius * 24 + arm) * 0.018 + normal() * 0.028;
      particle(dust, Math.cos(angle) * radius, Math.sin(angle) * radius, 0.027 + normal() * 0.01, 12 + random() * 37, [0.012, 0.015, 0.028], 0.025 + random() * 0.035, 2);
    }
    addLayer(dust, true, 1, false);

    // Tens of thousands of pinprick stars supply the granular, photographic texture.
    const stars = [];
    for (let i = 0; i < 64000; i++) {
      const radius = Math.pow(random(), 0.70) * 1.02;
      const [x, y, z] = armPosition(radius, i % 3, i % 6 === 0 ? 4 : 1.08);
      const warm = Math.exp(-radius * 7);
      const color = [lerp(0.58 + random() * 0.20, 1, warm), lerp(0.67 + random() * 0.22, 0.88, warm), lerp(1, 0.76, warm)];
      const bright = random() > 0.992;
      particle(stars, x, y, z, bright ? 7 + random() * 13 : 0.8 + Math.pow(random(), 2.5) * 3.9, color, (bright ? 0.75 : 0.20 + random() * 0.57) * clamp((1.09 - radius) / 0.16), bright ? 1 : 0);
    }
    for (let i = 0; i < 5600; i++) {
      const radius = Math.pow(random(), 1.3) * 0.24;
      const angle = random() * TAU;
      particle(stars, Math.cos(angle) * radius, Math.sin(angle) * radius, normal() * Math.min(0.026, radius * 0.4), 1 + random() * 3, [1, 0.91, 0.81], 0.3 + random() * 0.5);
    }
    for (let i = 0; i < 11000; i++) {
      const radius = Math.pow(random(), 0.8) * 0.91, angle = random() * TAU;
      particle(stars, Math.cos(angle) * radius, Math.sin(angle) * radius, normal() * 0.012, 0.7 + random() * 1.8, [0.73, 0.76, 0.92], 0.22 + random() * 0.3);
    }
    addLayer(stars, true);

    // An oblique star cluster and a handful of foreground stars complete the depth.
    const foreground = [];
    const heroStars = [[650, 312, 32], [1980, 384, 26], [2140, 1000, 21], [400, 960, 18], [1600, 180, 16], [895, 1140, 17]];
    for (const [x, y, size] of heroStars) particle(foreground, x, y, 0, size, [0.80, 0.86, 1], 0.88, 1);
    addLayer(foreground, false);
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(DESIGN_WIDTH * DESIGN_HEIGHT / (width * height)));
    universe.width = reactions.width = Math.round(width * pixelRatio);
    universe.height = reactions.height = Math.round(height * pixelRatio);
    designScale = Math.max(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    overlayDirty = false;
    if (gl && cloudTexture) {
      cloudWidth = Math.max(1, Math.round(universe.width / 2)); cloudHeight = Math.max(1, Math.round(universe.height / 2));
      gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cloudWidth, cloudHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, cloudFramebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, cloudTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      cloudFrame = -Infinity;
    }
    if (manuallyDriven || paused) render(sceneTime, 0);
  }

  function drawParticleLayers(seconds, clouds) {
    const scale = clouds ? 0.5 : 1;
    gl.useProgram(program);
    gl.uniform2f(uniforms.Resolution, clouds ? cloudWidth : universe.width, clouds ? cloudHeight : universe.height);
    gl.uniform1f(uniforms.Scale, designScale * pixelRatio * scale);
    gl.uniform1f(uniforms.PixelRatio, pixelRatio);
    gl.uniform1f(uniforms.Time, seconds);
    // Roughly 30 minutes per revolution at the default speed. The visual stillness is deliberate.
    gl.uniform1f(uniforms.Rotation, -0.19 + seconds * 0.0061 * settings.rotationSpeed);
    for (let index = 0; index < layers.length; index++) {
      if ((index >= 1 && index <= 3) !== clouds) continue;
      const layer = layers[index];
      gl.blendFuncSeparate(gl.SRC_ALPHA, layer.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(uniforms.Galaxy, layer.galaxy ? 1 : 0);
      gl.uniform1f(uniforms.Brightness, layer.brightness * (layer.galaxy ? 0.85 + settings.starBrightness * 0.25 : 0.75 + settings.starBrightness * 0.3));
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.buffer);
      const stride = 10 * Float32Array.BYTES_PER_ELEMENT;
      for (const [location, count, offset] of [[positionLocation, 3, 0], [sizeLocation, 1, 3], [colorLocation, 4, 4], [phaseLocation, 1, 8], [kindLocation, 1, 9]]) {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, count, gl.FLOAT, false, stride, offset * 4);
      }
      gl.drawArrays(gl.POINTS, 0, layer.count);
    }
  }
  function drawGalaxy(seconds, forceClouds = false) {
    if (!gl || !program) return;
    gl.clearColor(0, 0, 0, 0);
    // A 31-minute revolution moves less than one pixel between cached gas frames.
    if (forceClouds || Math.abs(seconds - cloudFrame) >= 1 / 12) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, cloudFramebuffer);
      gl.viewport(0, 0, cloudWidth, cloudHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      drawParticleLayers(seconds, true);
      cloudFrame = seconds; cloudFrames++;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, universe.width, universe.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(cloudProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, cloudQuad);
    for (const location of [positionLocation, sizeLocation, colorLocation, phaseLocation, kindLocation]) gl.disableVertexAttribArray(location);
    gl.enableVertexAttribArray(cloudPosition);
    gl.vertexAttribPointer(cloudPosition, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, cloudTexture);
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    drawParticleLayers(seconds, false);
  }

  function onAudio(payload) {
    if (lockMode || paused || !settings.audio || !payload || !Array.isArray(payload.bands) || payload.bands.length !== 64) return;
    if (!payload.bands.every(Number.isFinite) || !Number.isFinite(payload.rms) || !Number.isFinite(payload.peak)) return;
    for (let i = 0; i < 64; i++) audio.target[i] = clamp(payload.bands[i]);
    audio.rms = clamp(payload.rms);
    audio.peak = clamp(payload.peak);
    audio.lastAt = performance.now();
    audio.received++;
  }

  function onPointer(payload) {
    if (lockMode || !settings.mouse || !payload || !Number.isFinite(payload.x) || !Number.isFinite(payload.y)) return;
    const x = clamp(payload.x), y = clamp(payload.y);
    const oldX = pointer.x, oldY = pointer.y, wasInside = pointer.inside;
    pointer.previousX = oldX; pointer.previousY = oldY;
    pointer.x = x; pointer.y = y; pointer.inside = payload.inside === true;
    pointer.lastAt = performance.now(); pointer.received++;
    if (!pointer.inside || !wasInside || paused || reducedMotion.matches) return;
    const distance = Math.hypot((x - oldX) * width, (y - oldY) * height);
    if (distance < 0.4) return;
    const count = Math.min(18, Math.ceil(distance / 7));
    for (let i = 0; i < count; i++) {
      const t = (i + 1) / count;
      motes.push({ x: lerp(oldX, x, t), y: lerp(oldY, y, t), vx: (random() - 0.5) * 0.009, vy: (random() - 0.5) * 0.009, life: 0.8 + random() * 0.65, initial: 1.45, size: 0.6 + random() * 1.7, phase: random() * TAU });
    }
    if (motes.length > 350) motes.splice(0, motes.length - 350);
  }

  function drawReactions(seconds, dt) {
    if (lockMode) return;
    const now = performance.now();
    if (!settings.audio || now - audio.lastAt > 420) { audio.target.fill(0); audio.rms = 0; audio.peak = 0; }
    const ease = dt ? 1 - Math.exp(-dt * 13) : 1;
    for (let i = 0; i < 64; i++) audio.bands[i] = lerp(audio.bands[i], audio.target[i], ease);
    const activity = audio.bands.reduce((sum, band) => sum + band, 0) / 64;
    const active = (settings.audio && activity > 0.0002) || (settings.mouse && motes.length > 0);
    if (!active && !overlayDirty) return;
    overlay.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    overlay.clearRect(0, 0, width, height);
    overlayDirty = active;
    const reactionScale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    if (settings.audio && activity > 0.0002) {
      const scale = reactionScale;
      const centerX = width * 0.5, baseY = height * 0.872;
      const spacing = 9.5 * scale, barWidth = 2.2 * scale;
      const opacity = Math.min(0.84, activity * 3 + 0.24) * settings.intensity;
      overlay.save();
      overlay.globalCompositeOperation = 'lighter';
      const gradient = overlay.createLinearGradient(centerX, baseY - 88 * scale, centerX, baseY + 32 * scale);
      gradient.addColorStop(0, `rgba(231,235,255,${opacity})`);
      gradient.addColorStop(0.62, accent(opacity * 0.92));
      gradient.addColorStop(1, `rgba(135,192,244,${opacity * 0.05})`);
      overlay.fillStyle = gradient;
      overlay.shadowBlur = 8 * scale;
      overlay.shadowColor = accent(0.32);
      const bars = new Path2D(), reflections = new Path2D();
      for (let i = 0; i < 64; i++) {
        // Low frequencies sit near the center; both halves still use independent bands.
        const source = i < 32 ? 62 - i * 2 : (i - 32) * 2 + 1;
        const band = audio.bands[source];
        const barHeight = Math.pow(band, 1.3) * 93 * scale * settings.intensity;
        if (barHeight < 0.2 * scale) continue;
        const x = centerX + (i - 31.5) * spacing;
        bars.roundRect(x - barWidth / 2, baseY - barHeight, barWidth, barHeight + 1.5 * scale, barWidth / 2);
        reflections.rect(x - barWidth / 2, baseY + 5 * scale, barWidth, barHeight * 0.26);
      }
      overlay.fill(bars); overlay.globalAlpha = 0.17; overlay.fill(reflections);
      overlay.restore();
    }
    if (!settings.mouse) { motes.length = 0; return; }
    overlay.save();
    overlay.globalCompositeOperation = 'lighter';
    for (let i = motes.length - 1; i >= 0; i--) {
      const mote = motes[i];
      mote.life -= dt;
      if (mote.life <= 0) { motes.splice(i, 1); continue; }
      mote.x += mote.vx * dt; mote.y += mote.vy * dt;
      const alpha = Math.pow(mote.life / mote.initial, 1.7) * settings.intensity;
      const x = mote.x * width, y = mote.y * height;
      const size = 40 * reactionScale;
      overlay.globalAlpha = alpha;
      overlay.drawImage(moteSprites[mote.size > 1.8 ? 1 : 0], x - size / 2, y - size / 2, size, size);
    }
    overlay.restore();
  }

  function render(seconds, dt, forceClouds = false) {
    const started = performance.now();
    drawGalaxy(seconds, forceClouds);
    drawReactions(seconds, dt);
    renderedFrames++;
    lastFrameCost = performance.now() - started;
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (paused || manuallyDriven || disposed) { lastTick = lastRenderedAt = now; return; }
    const frameInterval = 1000 / (reducedMotion.matches ? Math.min(settings.fps, 15) : settings.fps);
    if (now - lastTick < frameInterval) return;
    const dt = Math.min(0.12, (now - lastRenderedAt) / 1000 || 1 / settings.fps);
    lastRenderedAt = now;
    lastTick = now - ((now - lastTick) % frameInterval);
    if (!reducedMotion.matches) sceneTime += dt;
    render(sceneTime, dt);
  }
  function applyProperties(values = {}) {
    if (typeof values.audio === 'boolean') settings.audio = !lockMode && values.audio;
    if (typeof values.mouse === 'boolean') settings.mouse = !lockMode && values.mouse;
    if (Number.isFinite(values.intensity)) settings.intensity = clamp(values.intensity);
    if (/^#[a-f\d]{6}$/i.test(values.color || '') && values.color !== settings.color) { settings.color = values.color; prepareMoteSprites(); }
    if (values.fps === 30 || values.fps === 60) settings.fps = values.fps;
    if (Number.isFinite(values.rotationSpeed)) settings.rotationSpeed = clamp(values.rotationSpeed, 0, 2);
    if (Number.isFinite(values.starBrightness) && values.starBrightness !== settings.starBrightness) { settings.starBrightness = clamp(values.starBrightness); cloudFrame = -Infinity; }
    if (!settings.audio) { audio.target.fill(0); audio.bands.fill(0); audio.rms = 0; audio.peak = 0; }
    if (!settings.mouse) { motes.length = 0; pointer.inside = false; }
    if (paused || manuallyDriven) render(sceneTime, 0);
  }
  function setPaused(value) {
    paused = Boolean(value);
    lastTick = lastRenderedAt = performance.now();
    if (paused) { audio.target.fill(0); audio.bands.fill(0); motes.length = 0; render(sceneTime, 0); }
  }
  if (bridge && typeof bridge.on === 'function') {
    disposers.push(bridge.on('ready', event => applyProperties(event.properties)));
    disposers.push(bridge.on('properties', applyProperties));
    disposers.push(bridge.on('lifecycle', event => { if (event.fps) applyProperties({ fps: event.fps }); setPaused(event.state === 'paused'); }));
    if (!lockMode) { disposers.push(bridge.on('audio', onAudio)); disposers.push(bridge.on('pointer', onPointer)); }
  } else if (!lockMode) {
    const move = event => onPointer({ x: event.clientX / width, y: event.clientY / height, inside: true });
    const leave = () => { pointer.inside = false; };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave, { passive: true });
    disposers.push(() => window.removeEventListener('pointermove', move), () => document.documentElement.removeEventListener('pointerleave', leave));
  }
  window.addEventListener('resize', resize, { passive: true });
  disposers.push(() => window.removeEventListener('resize', resize));
  universe.addEventListener('webglcontextlost', event => { event.preventDefault(); rendererError = 'WebGL context lost'; setPaused(true); });
  universe.addEventListener('webglcontextrestored', () => location.reload());

  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  window.astraScene = Object.freeze({
    ready,
    renderAt(seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) throw new TypeError('Time must be a nonnegative number.');
      manuallyDriven = true; sceneTime = seconds; render(sceneTime, 0, true); gl?.finish();
      return this.getDiagnostics();
    },
    resume() { manuallyDriven = false; lastTick = lastRenderedAt = performance.now(); },
    setPaused,
    getDiagnostics() {
      return { mode: lockMode ? 'lock' : 'desktop', renderer: gl && !rendererError ? 'WebGL' : 'unavailable', rendererError, resolution: [universe.width, universe.height], designResolution: [DESIGN_WIDTH, DESIGN_HEIGHT], particles: generatedParticles, frames: renderedFrames, cloudFrames, cloudResolution: [cloudWidth, cloudHeight], seconds: sceneTime, requestedFps: settings.fps, lastFrameCostMs: Number(lastFrameCost.toFixed(2)), paused, manuallyDriven, bridge: Boolean(bridge), audioEnabled: settings.audio, mouseEnabled: settings.mouse, audioEvents: audio.received, pointerEvents: pointer.received, audioEnergy: Number((audio.bands.reduce((sum, value) => sum + value, 0) / 64).toFixed(6)), activeTrailParticles: motes.length, liveAudioOnly: true };
    },
    dispose() { disposed = true; cancelAnimationFrame(raf); for (const unsubscribe of disposers) unsubscribe?.(); for (const layer of layers) gl?.deleteBuffer(layer.buffer); gl?.deleteProgram(program); gl?.deleteProgram(cloudProgram); gl?.deleteBuffer(cloudQuad); gl?.deleteTexture(cloudTexture); gl?.deleteFramebuffer(cloudFramebuffer); }
  });
  try { createUniverse(); } catch (error) { rendererError = error.message; console.error('ASTRA renderer:', error); }
  prepareMoteSprites();
  resize();
  render(0, 0);
  resolveReady(window.astraScene.getDiagnostics());
  lastTick = lastRenderedAt = performance.now();
  raf = requestAnimationFrame(tick);
})();
