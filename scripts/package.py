#!/usr/bin/env python3
# Copyright 2026 aidevksh. SPDX-License-Identifier: Apache-2.0
"""Build independently importable ZIPs; runtime dependencies are never included."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
out = root / 'dist'
out.mkdir(exist_ok=True)
for item in json.loads((root / 'catalog.json').read_text(encoding='utf-8')):
    folder = root / item['id']
    files = sorted(p for p in folder.iterdir() if p.is_file())
    with ZipFile(out / (item['id'] + '.zip'), 'w', ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, file.name)
    with ZipFile(out / (item['id'] + '.zip')) as archive:
        assert archive.testzip() is None
        assert {'index.html', 'style.css', 'main.js', 'wallpaper.json', 'preview.png', 'LICENSE', 'NOTICE'} <= set(archive.namelist())
    print('Built', item['id'] + '.zip')
