#!/usr/bin/env bash
# Çok oyunculu testler: Worker'ı yerel D1 ile (wrangler dev, 8787) başlatır ve Yolcular, mesaj, el sallama, Kervan testlerini çalıştırır.
# Kullanım: tests/run-online.sh   (tests klasöründe npm install gerekir: wrangler ve playwright)
set -u
# başlatılan sunucuyu alt süreçleriyle (npx → wrangler → workerd) birlikte kapatır
killtree() {
  # Windows (Git Bash): pgrep yok; süreç ağacı Windows kimliğiyle taskkill /T ile kapatılır
  if ! command -v pgrep >/dev/null 2>&1; then
    [ -r "/proc/$1/winpid" ] && taskkill //F //T //PID "$(cat "/proc/$1/winpid")" >/dev/null 2>&1
    kill "$1" 2>/dev/null; return
  fi
  for c in $(pgrep -P "$1"); do killtree "$c"; done; kill "$1" 2>/dev/null
}
cd "$(dirname "$0")"
# Windows (Git Bash): node "/c/..." biçimindeki yolları tanımaz; yollar "C:/..." biçimine çevrilir
HERE="$PWD"; command -v cygpath >/dev/null 2>&1 && HERE="$(cygpath -m "$PWD")"
export SP="$HERE/out"; mkdir -p "$SP"
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
# Windows: npx → cmd → wrangler → workerd zinciri bash'in süreç kimliğinden her zaman bulunamıyor; komut satırından bulunup kapatılır
if [ -n "$DEV" ] && ! command -v pgrep >/dev/null 2>&1 && command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -Command 'Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match "wrangler(\.js)?.? dev --port 8787" } | ForEach-Object { taskkill /F /T /PID $_.ProcessId 2>$null | Out-Null }' >/dev/null 2>&1
fi
