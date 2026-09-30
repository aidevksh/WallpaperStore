// Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const catalog = JSON.parse(fs.readFileSync('catalog.json'));
assert.equal(catalog.length, 11);
assert.equal(new Set(catalog.map(item => item.id)).size, 11);
for (const { id, name } of catalog) {
  const manifest = JSON.parse(fs.readFileSync(`${id}/wallpaper.json`));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.name, name);
  assert.equal(manifest.author, 'aidevksh');
  assert.equal(manifest.license, 'Apache-2.0');
  for (const file of [manifest.entry, manifest.preview, 'style.css', 'main.js', 'LICENSE', 'NOTICE', 'README.md']) {
    assert(fs.statSync(`${id}/${file}`).size > 0, `${id}/${file} missing or empty`);
  }
  assert.equal(fs.readFileSync(`${id}/LICENSE`, 'utf8'), fs.readFileSync('LICENSE', 'utf8'));
  execFileSync(process.execPath, ['--check', `${id}/main.js`]);
  console.log(`PASS ${id}: manifest, files, license, JavaScript syntax`);
}
