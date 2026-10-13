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
tests/run-all.sh       # tam regresyon seti; oyunu 8765 portunda kendisi açar, özet out/regress.out
tests/run-all.sh quick # hızlı mod: aynı set, fuzz hariç (kayıt, döngü ya da genel arayüz değişmediyse yeter)
tests/run-all.sh only birds,kites   # yalnızca adı verilen betikler (geliştirirken)
JOBS=6 tests/run-all.sh             # aynı anda çalışan betik sayısı (varsayılan 4)
tests/run-online.sh    # çok oyunculu testler; Worker'ı yerel D1 ile 8787 portunda kendisi başlatır
node tests/keys.js     # beş dil sözlüğünü karşılaştırır: eksik/fazla anahtar, yer tutucu ve etiket farkları
```

Betikler JOBS kadarı aynı anda çalışır; zamanlamaya ya da sayfa yenilemeye duyarlı olanlar (`off`, `cycle`, `cyctheme`, `guards`,
`update`, `persist`, `backup`, `stress`) en sonda tek tek çalışır. Çıktı sırası listedeki sırayla aynıdır. Doğal gelişi bekleyen
bölümler (kuş, turna, uçurtma, mektup, tilki, takımyıldız, yunus, yadigâr, karahindiba, hasat penceresi, Göç Yolu) oyunu
`pw.speed(20)` ile `?testspeed=20` adresinden açar: olay zamanlayıcıları 20 kat hızlı işler (yalnızca localhost'ta, en çok 50;
ekonomi ve etki süreleri etkilenmez; beklenen olay gelince test `__testSpeed(1)` ile hızı normale döndürebilir).
Paralel koşuda zaman aşımına ya da yükleme hatasına düşen betik, sonda bir kez tek başına yeniden denenir (çıktıda
"paralelde düştü, tek başına yeniden denendi" yazar); iki kez düşen gerçek hatadır.

Tek bir testi çalıştırmak için önce oyunu sun, sonra betiği çağır:

```bash
python3 -m http.server 8765 -d public   # ayrı bir terminalde
node tests/routes.js
```

Eski kayıtlarla açılan testlerde ad penceresi araya girmesin diye `run-all.sh` her betiğe `pw_name.js` ön yüklemesini
ekler (`node -r tests/pw_name.js …`); kaydında gezgin adı yoksa "Test" adı verilir.

Ne zaman hangisi: oturum başında tam set gerekmez (`keys.js` ve `node --check` yeter); geliştirirken yalnızca değişen yerin
betiği; yayından hemen önce bir kez tam set ya da hızlı mod. Ayrıntı için kökteki `CLAUDE.md`.

`run-all.sh` çıktısında beklenen birkaç bilgi satırı vardır, hata değildir: `boşluk (select odaklı) adım attı mı: false`,
`döngü kapanınca saat sıçradı mı: false`, hazine defteri satırları, `çevrimiçi anahtar: yok`, `mp_off` testinin
"ulaşılamıyor" durumu ve `toast.badge` yer tutucu farkı (Almanca dışı dillerde kademe adı küçük harfle kullanılır).

## Betikler

| Grup | Betikler |
| --- | --- |
| Temel oyun | `func` (ilk dakikalar), `stress`, `persist` (kayıt), `feat`, `home` (eve dönüş), `off` (çevrimdışı), `star`, `daily`, `outfit`, `stable` (düğmeler kaymaz), `header`, `cycle`, `cyctheme`, `scale`, `settings`, `tiers`, `lookgame`, `fxpill`, `routes`, `routes7`, `pals`, `stack`, `dismiss`, `treasure`, `trade` (garaj: ipucusuz kartlar, Sv. eşikleri), `keeps` (yadigârlar), `looks200` (Sv. 150/200 görünümleri, Fener Yolu), `zoom` (sahne yakınlaştırma), `seed` (karahindiba tohumu: gündüz belirir, gece belirmez), `unittip` (AB ve ışık yılı açıklaması), `cranes` (Turna Yolu: turna sürüsü, onuncu rota), `kites` (Uçurtma Yolu: serbest ve bağlı uçurtma, yeniden açılış, bırakma, telefonda yerleşim, on birinci rota), `fair` (dönüş penceresinde rota seçimi, eski kayıtta yeni rotanın duyurulması, açık temada uzayda gece sayacı ve kayan yıldız, ay gökkuşağı), `newveh` (Kuyruklu Yıldız ve Yıldız Gemisi; telefonda kesilmeyen yükseltme adları), `reward` (sandık ödülü kalıcı gelirle: dilek ve gökkuşağı ödülü şişirmez), `letters` (mektuplar: kâğıt uçak, mektup penceresi, defterdeki zarflar, son mektup ve kıyafeti), `fox` (Kızıl: yabani tilki gündüz/gece/telefonda, üç karşılaşmada yol arkadaşı, kilitli kartın pati izleri, araçlarda tilki), `backup` (okunamayan kayıt ezilmez, yedekten sürülür; bildirimler solarak gider), `consts` (takımyıldızlar: gece belirir, dokunarak birleştirme, gökyüzü haritası, sekizincide kıyafet, telefonda yerleşim), `dolphins` (yunuslar: kıyı denizinde gündüz/gece/telefonda sıçrayış, selam bir kez sayılır, yedi selamda Denizci kıyafeti, denizsiz bölgede gelmez), `ambient` (ses manzarası: kıyıda deniz katmanı, ovada kuş olayları, ortam sesi kapalıyken olay yok), `moments` (Özel Anlar: kelebek ve kuşla kartpostal, mühürler, bildirim, defter, albüm, sekizinci anda altın çerçeve, bozuk kayıt), `jnav` (Yol Defteri gezinme şeridi: var olan bölümlerin çipleri, dokununca bölüme kayma, yeniden çizimde kaydırmanın korunması, telefon ve koyu tema), `aura` (Sv. 300 ve 500 görünümleri: yerde, trende, uçan araçta gündüz/gece, garaj simgeleri, Sv. 300 bildirimi), `album` (Kartpostal Albümü: çekilen kartpostal albüme girer, en çok 12 ve en yenisi başta, büyük görünüm, sıfırlama albümü siler, bozuk albüm, koyu tema ve telefon), `chrono` (Zaman Makinesi: satın alma, Sv. 0'da 1/sn ve Sv. 100'de 6/sn otomatik adım, elle adım sayılmaz, defter sayacı, görünüm aşamaları, 320 px'te beş dil), `migrate` (Göç Yolu: rota kartı, Hüdhüd gündüz/gece/telefonda, dokununca etki ve defterde gizli sayfa, yalnızca bu rotada kendiliğinden gelmesi), `notes` (Günün Notları: herkese aynı üç not, sekme noktası, adım/kelebek/kartpostal notlarının ödülleri, üçünün hediyesi, ertesi gün yenilenme, bozuk kayıt, koyu tema ve 320 px'te beş dil), `newveh3` (Yıldız Balinası, Samanyolu Treni ve Anka Kuşu: sırayla satın alma, görünüm aşamaları gündüz/gece, garaj simgeleri, 320 px'te beş dilde yükseltme adları), `harvest` (hasat mevsimi: balkabağı öbeği, saman balyası ve korkuluk gündüz/gece/telefonda, gece fenerleri, günde bir hasat payı, mevsim dışında ve çölde yok), `birds` (Kuş Defteri: yedi kuş kendi bölgesinde gündüz/gece/telefonda, dokununca deftere yazılır ve bir kez sayılır, defterde renkli kuş ve siluet, yedinci kuşta Kuş Gözlemcisi kıyafeti, bozuk ve eski kayıt, köyde kendiliğinden gelmesi), `layout` (telefon yerleşimi v1.56: sahnenin üstünde yazı yok, pano, alttan açılan sayfa, katlanır kartlar, yatayda pano panelde), `guards` (iki sekme birbirinin kaydını ezmez, korunan kayıt sıfırlamayla silinmez, saat geri alınınca etki uzamaz ve çevrimdışı ilerleme tekrarlanmaz, iki dilek ×100 değil ×10), `update` (yeni sürümde kendiliğinden yenilenme), `i18n`, `fuzz` |
| Çok oyunculu (8787) | `mp` (ad, Yolcular, sıralama, tüm zamanlar), `mp_off` (sunucusuz), `chat` (hazır mesajlar), `wave` (el sallama), `caravan` (Kervan, canlı mesafe), `forge` (tüm zamanlar sahteciliğine karşı makullük sınırı), `trains`, `ghosts`, `ghost_tap`, `tabs`, `land` (yatay telefon), `popmodal`, `audit` (gece/koyu tema) |
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
