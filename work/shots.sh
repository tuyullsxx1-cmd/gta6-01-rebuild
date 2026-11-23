#!/bin/bash
# shots.sh — render the 4 staged screenshots with headless Chromium, then
# convert to JPEG (<=256 KiB each) into repo13/screenshots/.
set -e
REPO="$HOME/workspace/goals/pantau-race-btc-make-fun/files/gta6-game/repo13"
CHROME="$HOME/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome"
PORT=18791
OUT="$REPO/screenshots"
TMP="/tmp/gta6-shots"
mkdir -p "$OUT" "$TMP"

# static server for game/
cd "$REPO/game"
python3 -m http.server $PORT --bind 127.0.0.1 >/tmp/gta6-server.log 2>&1 &
SRV=$!
trap "kill $SRV 2>/dev/null || true" EXIT
sleep 1

for N in 1 2 3 4; do
  echo "=== shot $N ==="
  "$CHROME" --headless=new --disable-gpu --enable-unsafe-swiftshader \
    --use-angle=swiftshader --no-sandbox --disable-dev-shm-usage \
    --window-size=1280,720 --hide-scrollbars \
    --virtual-time-budget=12000 \
    --screenshot="$TMP/shot$N.png" \
    "http://127.0.0.1:$PORT/index.html?shot=$N" 2>&1 | tail -2
  ls -la "$TMP/shot$N.png"
done

# convert PNG -> JPEG (quality ladder until <=256 KiB)
python3 - "$TMP" "$OUT" <<'EOF'
import sys
from PIL import Image
import os
tmp, out = sys.argv[1], sys.argv[2]
names = {1: '1-cover.jpg', 2: '2-marina.jpg', 3: '3-plaza.jpg', 4: '4-mission.jpg'}
for n, name in names.items():
    src = os.path.join(tmp, f'shot{n}.png')
    dst = os.path.join(out, name)
    im = Image.open(src).convert('RGB')
    print(name, 'source', im.size)
    q = 88
    while q >= 40:
        im.save(dst, 'JPEG', quality=q, optimize=True)
        sz = os.path.getsize(dst)
        print(f'  q={q} -> {sz} bytes')
        if sz <= 262144:
            break
        q -= 8
    print('  final:', dst, os.path.getsize(dst), 'bytes')
EOF
echo "DONE"
ls -la "$OUT"
