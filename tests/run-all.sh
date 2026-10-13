#!/usr/bin/env bash
# Tam regresyon seti: oyunu statik sunucuda (8765) açar, her betiğin hata satırlarını out/regress.out'a yazar.
# Kullanım: tests/run-all.sh                 tam set (~6 dk)
#           tests/run-all.sh quick           hızlı mod: fuzz hariç (~4 dk); kayıt, döngü ya da genel arayüz değişmediyse yeter
#           tests/run-all.sh only a,b,c      yalnızca adı verilen betikler (geliştirirken)
# Betikler JOBS (varsayılan 4) kadarı aynı anda çalışır; zamanlamaya duyarlı olanlar (SERIAL) en sonda tek tek çalışır.
# Doğal gelişi bekleyen testler oyunu ?testspeed=20 ile açar (yalnızca localhost'ta: olay zamanlayıcıları 20 kat hızlı).
# Çıktı sırası listedeki sırayla aynıdır.
# (Python 3 ve Playwright gerekir; bkz. tests/README.md)
set -u
QUICK=""; ONLY=""
[ "${1:-}" = "quick" ] && QUICK=1
[ "${1:-}" = "only" ] && ONLY="${2:-}"
JOBS="${JOBS:-4}"
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
PARTS="$SP/parts"; rm -rf "$PARTS"; mkdir -p "$PARTS"
# statik sunucu: açık değilse başlat, bitince kapat
SRV=""
if ! curl -s -o /dev/null http://localhost:8765/; then
  python3 -m http.server 8765 -d ../public >/dev/null 2>&1 & SRV=$!
  for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8765/ && break; sleep 0.3; done
fi
# eski kayıtlarla açılan testlerde ad penceresi araya girmesin
export NODE_OPTIONS="-r $HERE/pw_name.js"
ALL="func stress persist feat home off star daily outfit stable header cycle cyctheme scale settings tiers lookgame fxpill routes pals stack dismiss treasure trade keeps update looks200 zoom seed unittip cranes newveh reward letters fox backup consts kites fair dolphins guards layout birds harvest newveh3 notes migrate chrono album aura jnav moments ambient"
# zamanlamaya ya da sayfa yenilemeye duyarlı betikler: paralel yük altında kararsızlaşmasınlar diye en sonda tek tek
SERIAL=" off cycle cyctheme guards update persist backup stress "
LIST="$ALL"; [ -n "$ONLY" ] && LIST="${ONLY//,/ }"
run_one() {
  timeout 300 node "$1.js" 2>&1 | grep -iE "error|KAYDI|şüpheli|∞|NaN|sıçradı|adım attı" | grep -v ERR_CERT | grep -v "501 (Unsupported" | head -6 > "$PARTS/$1.out"
}
# uzun süren fuzz ve i18n en başta havuza girer (birer yuva tutar)
if [ -z "$ONLY" ]; then
  ( timeout 200 node i18n.js de-DE,es-ES,fr-FR 2>&1 | grep -E "çevrilmemiş|errors" | sort | uniq -c > "$PARTS/__i18n.out" ) &
  [ -z "$QUICK" ] && ( timeout 1200 node fuzz.js 2>&1 | grep -v "501 (Unsupported" | tail -8 > "$PARTS/__fuzz.out" ) &
fi
for f in $LIST; do
  case "$SERIAL" in *" $f "*) continue ;; esac
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do sleep 0.5; done
  run_one "$f" &
done
wait
for f in $LIST; do case "$SERIAL" in *" $f "*) run_one "$f" ;; esac; done
for f in $LIST; do echo "== $f" >> "$OUT"; cat "$PARTS/$f.out" >> "$OUT" 2>/dev/null; done
if [ -z "$ONLY" ]; then
  echo "== i18n" >> "$OUT"; cat "$PARTS/__i18n.out" >> "$OUT" 2>/dev/null
  if [ -n "$QUICK" ]; then echo "== fuzz (hızlı mod: atlandı)" >> "$OUT"
  else echo "== fuzz" >> "$OUT"; cat "$PARTS/__fuzz.out" >> "$OUT" 2>/dev/null; fi
  echo "== mp_off (ön yüklemesiz)" >> "$OUT"; NODE_OPTIONS= timeout 120 node mp_off.js 2>&1 | tail -3 >> "$OUT"
fi
echo "== anahtarlar" >> "$OUT"; NODE_OPTIONS= node keys.js 2>&1 | tail -5 >> "$OUT"
echo "== BİTTİ" >> "$OUT"
[ -n "$SRV" ] && killtree "$SRV"
cat "$OUT"
