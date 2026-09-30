// Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0
// Render the Bunny Garden sample at the M1 MacBook Air's native resolution.
// Run: node scripts/record-bunny.mjs (requires ffmpeg and Playwright Chromium).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist', 'bunny-garden-2560x1600-60fps.webm');
const width = 2560, height = 1600, fps = 60, seconds = 30;
fs.mkdirSync(path.dirname(output), { recursive: true });
let source = fs.readFileSync(path.join(root, 'bunny-garden/main.js'), 'utf8');
assert(source.includes('resize();sync();'));
assert(source.includes('ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);'));
// Advance scene time explicitly so encoding speed cannot drop animation frames.
source = source.replace('resize();sync();', 'paused=true;resize();window.renderVideoFrame=draw;');
// Fill 16:10 with proportional artwork, cropping the outer edges instead of stretching rabbits.
source = source.replace('ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);',
  'const scale=Math.max(canvas.width/W,canvas.height/H);ctx.setTransform(scale,0,0,scale,(canvas.width-W*scale)/2,(canvas.height-H*scale)/2);');
const browser = await chromium.launch({ headless: true });
const log = fs.openSync(output + '.log', 'w');
const encoder = spawn('ffmpeg', [
  '-hide_banner', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0',
  '-an', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuv420p', '-b:v', '0', '-crf', '28',
  '-cpu-used', '5', '-row-mt', '1', '-threads', '4', '-g', String(fps * 2),
  '-metadata', 'title=Bunny Garden — M1 MacBook Air sample',
  '-metadata', 'artist=aidevksh', '-metadata', 'copyright=Copyright 2026 aidevksh',
  '-metadata', 'license=Apache-2.0', output
], { stdio: ['pipe', 'ignore', log] });
fs.closeSync(log);
const finished = once(encoder, 'close');
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setContent('<html><body style="margin:0"><canvas id="scene"></canvas></body></html>');
  await page.addScriptTag({ content: source });
  for (let frame = 0; frame < seconds * fps; frame++) {
    const jpeg = await page.evaluate(t => {
      window.renderVideoFrame(t);
      return document.querySelector('canvas').toDataURL('image/jpeg', .98).split(',')[1];
    }, frame / fps);
    if (!encoder.stdin.write(Buffer.from(jpeg, 'base64'))) await once(encoder.stdin, 'drain');
    if (frame % 120 === 0) console.log(`Rendered ${frame}/${seconds * fps} frames (${frame / fps}s)`);
    assert.deepEqual(errors, []);
  }
  encoder.stdin.end();
  const [code] = await finished;
  assert.equal(code, 0, `FFmpeg failed; inspect ${output}.log`);
  fs.copyFileSync(path.join(root, 'bunny-garden/LICENSE'), path.join(root, 'dist/LICENSE'));
  fs.copyFileSync(path.join(root, 'bunny-garden/NOTICE'), path.join(root, 'dist/NOTICE'));
  console.log(`Saved ${output}`);
} finally {
  if (encoder.exitCode === null) encoder.kill('SIGTERM');
  await browser.close();
}
