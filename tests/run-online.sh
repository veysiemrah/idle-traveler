#!/usr/bin/env bash
# Çok oyunculu testler: Worker'ı yerel D1 ile (wrangler dev, 8787) başlatır ve Yolcular, mesaj, el sallama, Kervan testlerini çalıştırır.
# Kullanım: tests/run-online.sh   (tests klasöründe npm install gerekir: wrangler ve playwright)
set -u
# başlatılan sunucuyu alt süreçleriyle (npx → wrangler → workerd) birlikte kapatır
killtree() { for c in $(pgrep -P "$1"); do killtree "$c"; done; kill "$1" 2>/dev/null; }
cd "$(dirname "$0")"
export SP="$PWD/out"; mkdir -p "$SP"
W="${WRANGLER:-npx --prefix $PWD wrangler}"   # WRANGLER ile başka bir kurulum gösterilebilir
(cd .. && $W d1 migrations apply idle-traveler --local --persist-to "$SP/wrangler-state" >/dev/null)
DEV=""
if ! curl -s -o /dev/null http://127.0.0.1:8787/api/feed; then
  (cd .. && $W dev --port 8787 --ip 127.0.0.1 --persist-to "$SP/wrangler-state" > "$SP/wrangler-dev.log" 2>&1) & DEV=$!
  for _ in $(seq 1 60); do curl -s -o /dev/null http://127.0.0.1:8787/api/feed && break; sleep 1; done
fi
for f in mp chat wave caravan popmodal; do
  echo "== $f"
  timeout 200 node "$f.js" 2>&1 | grep -vE "^\s+at |^\s*$" | tail -6
done
[ -n "$DEV" ] && killtree "$DEV"
