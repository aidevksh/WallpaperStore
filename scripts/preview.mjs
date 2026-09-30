// Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const catalog = JSON.parse(fs.readFileSync('catalog.json'));
// Software WebGL also renders Galaxy on headless machines without a GPU.
const options = { headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROME_PATH) options.executablePath = process.env.CHROME_PATH;
const browser = await chromium.launch(options);
try {
  for (const { id } of catalog) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    await page.addInitScript(() => {
      window.wallpaperJS = { on: (name, fn) => { (window.hostListeners ??= {})[name] = fn; return () => {}; } };
    });
    await page.goto(pathToFileURL(path.resolve(id, 'index.html')).href);
    await page.waitForTimeout(1500);
    if (id === 'galaxy') {
      const hasWebGL = await page.evaluate(() => !!document.querySelector('canvas').getContext('webgl'));
      assert(hasWebGL, 'Galaxy WebGL unavailable');
    }
    const first = await page.screenshot();
    await page.waitForTimeout(550);
    const second = await page.screenshot();
    assert(!first.equals(second), `${id}: animation is static`);
    await page.screenshot({ path: `${id}/preview.png` });
    await page.evaluate(() => window.hostListeners.lifecycle?.({ state: 'paused', fps: 30 }));
    await page.waitForTimeout(150);
    const paused = await page.screenshot();
    await page.waitForTimeout(200);
    assert(paused.equals(await page.screenshot()), `${id}: lifecycle pause failed`);
    await page.evaluate(() => window.hostListeners.lifecycle?.({ state: 'running', fps: 30 }));
    await page.waitForTimeout(250);
    assert(!paused.equals(await page.screenshot()), `${id}: lifecycle resume failed`);
    await page.setViewportSize({ width: 900, height: 1200 });
    await page.waitForTimeout(100);
    assert(await page.evaluate(() => document.querySelector('canvas').width > 0));
    if (id !== 'galaxy') {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(150);
      const still = await page.screenshot();
      await page.waitForTimeout(200);
      assert(still.equals(await page.screenshot()), `${id}: reduced motion failed`);
    }
    assert.deepEqual(errors, [], `${id}: browser errors`);
    assert.deepEqual(requests, [], `${id}: external requests`);
    console.log(`PASS ${id}: animation, pause/resume, resize, offline render${id !== 'galaxy' ? ', reduced motion' : ''}`);
    await page.close();
  }
} finally {
  await browser.close();
}
