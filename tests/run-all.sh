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
  # komut ikamesiyle başlatılır: bu kabuğun işi (job) olmaz, aşağıdaki "wait" ve iş sayacı sunucuyu beklemez
  SRV=$(python3 -m http.server 8765 -d ../public >/dev/null 2>&1 & echo $!)
  for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:8765/ && break; sleep 0.3; done
fi
# eski kayıtlarla açılan testlerde ad penceresi araya girmesin
export NODE_OPTIONS="-r $HERE/pw_name.js"
ALL="func stress persist feat home off star daily outfit stable header cycle cyctheme scale settings tiers lookgame fxpill routes pals stack dismiss treasure trade keeps update looks200 zoom seed unittip cranes newveh reward letters fox backup consts kites fair dolphins guards layout birds harvest newveh3 notes migrate chrono album aura jnav moments ambient buffpips fireflies news msroad dreams dreamer v2-voyage-browser"
# zamanlamaya ya da sayfa yenilemeye duyarlı betikler: paralel yük altında kararsızlaşmasınlar diye en sonda tek tek
SERIAL=" off cycle cyctheme guards update persist backup stress "
LIST="$ALL"; [ -n "$ONLY" ] && LIST="${ONLY//,/ }"
run_one() {
  local name="$1" limit="$2" code
  shift 2
  timeout "$limit" node "$name.js" "$@" > "$PARTS/$name.log" 2>&1
  code=$?
  if [ "$code" -eq 0 ] && grep -qE '([A-Za-z]*Error:|name: .*[A-Za-z]*Error|not defined|Uncaught|Unhandled)' "$PARTS/$name.log"; then code=1; fi
  echo "$code" > "$PARTS/$name.status"
  grep -iE "error|KAYDI|şüpheli|∞|NaN|sıçradı|adım attı|çevrilmemiş" "$PARTS/$name.log" | grep -v ERR_CERT | grep -v "501 (Unsupported" | head -6 > "$PARTS/$name.out"
  if [ "$code" -ne 0 ]; then echo "FAIL $name (exit $code; see parts/$name.log)" >> "$PARTS/$name.out"; fi
  return 0
}
failed() { [ "$(cat "$PARTS/$1.status" 2>/dev/null)" != "0" ]; }
# uzun süren fuzz ve i18n en başta havuza girer (birer yuva tutar)
if [ -z "$ONLY" ]; then
  run_one i18n 200 de-DE,es-ES,fr-FR &
  if [ -z "$QUICK" ]; then run_one fuzz 1200 & fi
fi
for f in $LIST; do
  case "$SERIAL" in *" $f "*) continue ;; esac
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do sleep 0.5; done
  run_one "$f" 300 &
done
wait
for f in $LIST; do case "$SERIAL" in *" $f "*) run_one "$f" 300 ;; esac; done
# paralel yükte zaman aşımına düşen betik sonda bir kez tek başına yeniden denenir; iki kez düşen gerçek hatadır.
# Süre aşımı ve sessiz nonzero çıkışlar da durum dosyasından yakalanır.
for f in $LIST; do
  if failed "$f"; then
    cp "$PARTS/$f.log" "$PARTS/$f.first.log"; run_one "$f" 300
    sed -i '1i (ilk koşu başarısız, tek başına yeniden denendi)' "$PARTS/$f.out"
  fi
done
RESULT=0
for f in $LIST; do if failed "$f"; then RESULT=1; fi; done
for f in $LIST; do echo "== $f" >> "$OUT"; cat "$PARTS/$f.out" >> "$OUT" 2>/dev/null; done
if [ -z "$ONLY" ]; then
  echo "== i18n" >> "$OUT"; cat "$PARTS/i18n.out" >> "$OUT" 2>/dev/null
  if failed i18n; then RESULT=1; fi
  if [ -n "$QUICK" ]; then echo "== fuzz (hızlı mod: atlandı)" >> "$OUT"
  else echo "== fuzz" >> "$OUT"; cat "$PARTS/fuzz.out" >> "$OUT" 2>/dev/null; if failed fuzz; then RESULT=1; fi; fi
  echo "== mp_off (ön yüklemesiz)" >> "$OUT"; NODE_OPTIONS= run_one mp_off 120; tail -4 "$PARTS/mp_off.out" >> "$OUT"
  if failed mp_off; then RESULT=1; fi
fi
echo "== anahtarlar" >> "$OUT"; NODE_OPTIONS= run_one keys 30; tail -5 "$PARTS/keys.log" >> "$OUT"
if failed keys; then RESULT=1; fi
echo "== BİTTİ" >> "$OUT"
[ -n "$SRV" ] && killtree "$SRV"
cat "$OUT"
exit "$RESULT"
