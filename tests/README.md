# Idle Traveler – testler

Oyunu gerçek bir tarayıcıda (Playwright + Chromium) açıp tıklayan uçtan uca testler ve ekonomi simülasyonları.
Her betik tek başına çalışır, sonunda `no errors` (ya da yakaladığı sayfa hatalarını) yazar. Ekran görüntüleri
`tests/out/` klasörüne düşer (git'e girmez).

## Kurulum (bir kez)

Node.js 18+ ve Python 3 gerekir.

```bash
cd tests
npm install                      # playwright ve wrangler
npx playwright install chromium  # tarayıcı
```

## Çalıştırmak

```bash
tests/run-all.sh       # tam regresyon seti (~25 dk); oyunu 8765 portunda kendisi açar, özet out/regress.out
tests/run-online.sh    # çok oyunculu testler; Worker'ı yerel D1 ile 8787 portunda kendisi başlatır
node tests/keys.js     # beş dil sözlüğünü karşılaştırır: eksik/fazla anahtar, yer tutucu ve etiket farkları
```

Tek bir testi çalıştırmak için önce oyunu sun, sonra betiği çağır:

```bash
python3 -m http.server 8765 -d public   # ayrı bir terminalde
node tests/routes.js
```

Eski kayıtlarla açılan testlerde ad penceresi araya girmesin diye `run-all.sh` her betiğe `pw_name.js` ön yüklemesini
ekler (`node -r tests/pw_name.js …`); kaydında gezgin adı yoksa "Test" adı verilir.

`run-all.sh` çıktısında beklenen birkaç bilgi satırı vardır, hata değildir: `boşluk (select odaklı) adım attı mı: false`,
`döngü kapanınca saat sıçradı mı: false`, hazine defteri satırları, `çevrimiçi anahtar: yok`, `mp_off` testinin
"ulaşılamıyor" durumu ve `toast.badge` yer tutucu farkı (Almanca dışı dillerde kademe adı küçük harfle kullanılır).

## Betikler

| Grup | Betikler |
| --- | --- |
| Temel oyun | `func` (ilk dakikalar), `stress`, `persist` (kayıt), `feat`, `home` (eve dönüş), `off` (çevrimdışı), `star`, `daily`, `outfit`, `stable` (düğmeler kaymaz), `header`, `cycle`, `cyctheme`, `scale`, `settings`, `tiers`, `lookgame`, `fxpill`, `routes`, `routes7`, `pals`, `stack`, `dismiss`, `treasure`, `trade` (garaj: ipucusuz kartlar, Sv. eşikleri), `keeps` (yadigârlar), `looks200` (Sv. 150/200 görünümleri, Fener Yolu), `zoom` (sahne yakınlaştırma), `seed` (karahindiba tohumu: gündüz belirir, gece belirmez), `update` (yeni sürümde kendiliğinden yenilenme), `i18n`, `fuzz` |
| Çok oyunculu (8787) | `mp` (ad, Yolcular, sıralama, tüm zamanlar), `mp_off` (sunucusuz), `chat` (hazır mesajlar), `wave` (el sallama), `caravan` (Kervan, canlı mesafe), `trains`, `ghosts`, `ghost_tap`, `tabs`, `land` (yatay telefon), `popmodal`, `audit` (gece/koyu tema) |
| Araçlar | `keys` (sözlükler), `sim_switch` (verimli oyuncu: hangi seviyede araç değiştirir), `sim_tempo` / `sim_static` / `sim_price` (ekonomi), `extent` (araç çizim sınırlarını ölçer), `horse` (araç animasyonundan film şeridi: `node tests/horse.js bike`), `sim_trips` (art arda yolculukların süresi), `sim_game` (bütün olaylarla gerçek tempo: `node tests/sim_game.js '{"profile":"lucky","runs":20}'`), `gull` (kuş kanadı kareleri) |

Simülasyon örnekleri:

```bash
node tests/sim_tempo.js '{}' 12                           # açgözlü oyuncu: araçlara ulaşma süreleri, saatlik yol
node tests/sim_static.js public/js/data.js '{"G":[10]}' 9  # biriktiren / açgözlü / sabırlı oyuncu karşılaştırması
```

Garaj dengesini değiştirirken önce verimli oyuncu simülasyonuna bak; ayarları dosyaya dokunmadan JSON ile deneyebilirsin:

```bash
node tests/sim_switch.js 12 1                                     # data.js'teki değerlerle: geçiş seviyeleri, saatlik yol
node tests/sim_switch.js 12 1 '{"R":2.5,"C0":800,"Q":6,"S":1.05,"f":0.01,"g":1.095,"gain":0.1,"dbl":[25,50,100,150,200],"click":0.5}'
```
