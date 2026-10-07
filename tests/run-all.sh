#!/usr/bin/env bash
# Tam regresyon seti: oyunu statik sunucuda (8765) açar, her betiğin hata satırlarını out/regress.out'a yazar.
# Kullanım: tests/run-all.sh   (Python 3 ve Playwright gerekir; bkz. tests/README.md)
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
OUT="$SP/regress.out"; : > "$OUT"
# statik sunucu: açık değilse başlat, bitince kapat
SRV=""
if ! curl -s -o /dev/null http://localhost:8765/; then
  python3 -m http.server 8765 -d ../public >/dev/null 2>&1 & SRV=$!
  for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8765/ && break; sleep 0.3; done
fi
# eski kayıtlarla açılan testlerde ad penceresi araya girmesin
export NODE_OPTIONS="-r $HERE/pw_name.js"
for f in func stress persist feat home off star daily outfit stable header cycle cyctheme scale settings tiers lookgame fxpill routes pals stack dismiss treasure trade keeps update looks200 zoom seed; do
  echo "== $f" >> "$OUT"
  timeout 300 node "$f.js" 2>&1 | grep -iE "error|KAYDI|şüpheli|∞|NaN|sıçradı|adım attı" | grep -v ERR_CERT | grep -v "501 (Unsupported" | head -6 >> "$OUT"
done
echo "== i18n" >> "$OUT"; timeout 200 node i18n.js de-DE,es-ES,fr-FR 2>&1 | grep -E "çevrilmemiş|errors" | sort | uniq -c >> "$OUT"
echo "== fuzz" >> "$OUT"; timeout 1200 node fuzz.js 2>&1 | grep -v "501 (Unsupported" | tail -8 >> "$OUT"
echo "== mp_off (ön yüklemesiz)" >> "$OUT"; NODE_OPTIONS= timeout 120 node mp_off.js 2>&1 | tail -3 >> "$OUT"
echo "== anahtarlar" >> "$OUT"; NODE_OPTIONS= node keys.js 2>&1 | tail -5 >> "$OUT"
echo "== BİTTİ" >> "$OUT"
[ -n "$SRV" ] && killtree "$SRV"
cat "$OUT"
