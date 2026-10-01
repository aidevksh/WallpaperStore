// Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0
// Usage: node scripts/check-import.mjs /path/to/WallpaperJS
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
if (!process.argv[2]) throw new Error('Pass the local WallpaperJS repository path.');
const { Library } = require(path.resolve(process.argv[2], 'src/core/library.cjs'));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wallpaperstore-import-'));
try {
  const library = new Library(temp);
  for (const { id, name } of JSON.parse(fs.readFileSync('catalog.json'))) {
    for (const source of [id, `dist/${id}.zip`]) {
      const imported = library.import(path.resolve(source));
      assert.equal(library.project(imported).name, name);
      // WallpaperJS normalizes the manifest; artwork and runtime files must stay byte-identical.
      const original = JSON.parse(fs.readFileSync(`${id}/wallpaper.json`));
      const normalized = JSON.parse(fs.readFileSync(path.join(library.directory(imported), 'wallpaper.json')));
      for (const field of ['schemaVersion', 'name', 'entry', 'preview', 'description']) assert.equal(normalized[field], original[field]);
      for (const file of fs.readdirSync(id).filter(file => file !== 'wallpaper.json' && fs.statSync(path.join(id, file)).isFile())) {
        assert(fs.readFileSync(path.join(library.directory(imported), file)).equals(fs.readFileSync(`${id}/${file}`)), `${source}: ${file} changed during import`);
      }
    }
    console.log(`PASS ${id}: WallpaperJS folder and ZIP import`);
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
