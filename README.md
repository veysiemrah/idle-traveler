# Idle Traveler

Manzaralı bir yolda geçen, tarayıcıda çalışan rahatlatıcı bir idle (rölanti) oyunu.
Sırt çantalı bir yolcu yürüyerek başlar. Her tıklama bir adımdır, kat edilen her metre kredi kazandırır.
Kredilerle yeni araçlar, araç yükseltmeleri ve kalıcı güçlendirmeler alınır.

## Oynamak

Derleme adımı yok. Site dosyaları `public/` klasöründe; `public/index.html` dosyasını tarayıcıda açman yeterli.
Yolcular listesi Worker'a ihtiyaç duyar; onsuz oyun aynen çalışır, liste yalnızca "ulaşılamıyor" der.
İstersen basit bir sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000 -d public
# http://localhost:8000
```

Çok oyunculu özelliklerle (Yolcular, mesajlar, Kervan) birlikte yerelde çalıştırmak için Worker'ı yerel bir D1 kopyasıyla başlat:

```bash
cd tests && npm install && cd ..                                   # wrangler ve playwright (bir kez)
npx --prefix tests wrangler d1 migrations apply idle-traveler --local
npx --prefix tests wrangler dev                                    # http://localhost:8787
```

## Testler

`tests/` klasöründe oyunu gerçek bir tarayıcıda açıp tıklayan Playwright testleri ve ekonomi simülasyonları var.
Kurulum ve kullanım için `tests/README.md` dosyasına bak. Kısaca: `tests/run-all.sh` tam regresyon setini,
`tests/run-online.sh` çok oyunculu testleri çalıştırır; `node tests/keys.js` beş dil sözlüğünü karşılaştırır.

## Yayın: Cloudflare Workers → idle-traveler.vebaban.com

Site Cloudflare'de, statik varlık sunan bir Worker olarak barınır (`wrangler.jsonc`). Aynı Worker Yolcular API'sini de karşılar.
GitHub yalnızca repoyu tutar. Actions, Pages ya da secret kullanılmaz.
`main` dalına her push'ta Cloudflare Workers Builds repoyu çeker, `npx wrangler deploy` çalıştırır ve siteyi günceller.

Tek seferlik kurulum (Cloudflare panelinde):

1. **Workers & Pages → Create → Import a repository** adımında GitHub hesabını bağla ve `veysiemrah/idle-traveler` reposunu seç.
2. Ayarlar:
   - **Project/Worker name:** `idle-traveler`. `wrangler.jsonc` içindeki `name` ile aynı olmalı, yoksa build başarısız olur.
   - **Production branch:** `main`
   - **Build command:** boş bırak (derleme yok).
   - **Deploy command:** `npx wrangler deploy` (varsayılan)
3. **Save and Deploy.** İlk deploy, `wrangler.jsonc` içindeki `routes` ayarıyla `idle-traveler.vebaban.com` özel alan adını
   bağlar. DNS kaydını ve SSL sertifikasını Cloudflare kendisi oluşturur. Bunun için vebaban.com aynı Cloudflare hesabında olmalı.

> `idle-traveler` adında elle eklenmiş bir CNAME kaydı varsa (örneğin GitHub Pages için), önce onu sil.
> Cloudflare, mevcut bir CNAME kaydı olan ada özel alan adı bağlayamaz.

Ayarları doğrulamak için yerelde kuru çalıştırma yapabilirsin: `npx wrangler deploy --dry-run`.

### Yolcular API'si (Worker + D1)

`src/worker.js` statik dosyaları `public/` klasöründen sunar, yalnızca `/api/*` isteklerini kendisi karşılar. Veriler
`idle-traveler` adlı D1 veritabanındaki `players` tablosunda durur. Şema `migrations/` klasöründedir.

| İstek | Ne yapar |
| --- | --- |
| `POST /api/hello` | `{ id, key, name, dist, life, spd, trip, veh, route, tier, outfit, pal }`: kaydı ekler ya da günceller, yolcu listesini döner (`life`: bütün yolculukların toplam yolu, kayıtta hiç azalmaz) |
| `POST /api/top` | `{ id? }`: tüm zamanlar; toplam yola göre ilk 50 ve listede değilse isteyenin kendi satırı: `{ online, total, players, me }` |
| `POST /api/say` | `{ id, key, msg, to? }`: hazır mesaj ya da el sallama (`msg: 'wave'`, `to`: alıcının `pub`'ı) gönderir (yalnızca yoldaki, anahtarı tutan yolcu; en sık 4 sn'de bir), son mesajları döner |
| `GET /api/feed` | Son 20 saniyenin mesajları: `{ now, feed: [{ pub, msg, at, to }] }` |
| `GET /api/players` | Yalnızca yolcu listesi: `{ online, total, players: [{ pub, name, dist, spd, trip, veh, tier, outfit, pal, online, ago, rank, me, msg, msgAgo }], me }` |

- `id` herkese kapalı bir UUID'dir. `key`, tarayıcıda üretilen 64 haneli gizli anahtardır; sunucu yalnızca SHA-256
  özetini saklar. Başka biri aynı kimlikle kaydı değiştiremez (403).
- `pub`, gizli kimlikten türetilen kısa ve kalıcı bir anahtardır; sahne aynı gezgini bununla tanır, kimliği açık etmez.
- **Makullük sınırı (tüm zamanlar sahteciliğine karşı):** Bildirilen yol (bu yolculuk ve toplam), kaydın yaşında en hızlı dürüst
  oyuncunun ulaşabileceği yolun 10 katını aşamaz (v1.48'e kadar 100 katı); aşan değer reddedilmez, sınıra kırpılır. Sınır isteklerin
  sıklığıyla değil kaydın yaşıyla büyür (yeni kayıt en çok ~77.000 km, 1 saatlik kayıt ~10¹⁴ m, 1 günlük ~5×10¹⁶ m), böylece kısa aralıklı isteklerle
  tavan aşılamaz. Eğri `tests/sim_game.js '{"profile":"lucky","reach":1,"cps":5,"night":1,"hours":48}'` ile ölçüldü
  (Worker'daki `REACH`). v1.38'de simülasyon Kelebek Dostu'nu da almaya başlayınca eğrinin önceki ölçümden çok daha yüksek
  olduğu görüldü (v1.37 öncesi kurallarla 1. saatte ~2000 katı); tablo, bugünkü ve v1.37 öncesi kuralların büyüğüne göre
  yenilendi, böylece o kurallarla ilerlemiş dürüst kayıtlar da kırpılmaz. Canlıda kırpılmış bir kayıt görülmedi. v1.48'de pay 10 kata
  indi: bugünkü kurallarla en hızlı dürüst oyuncu (`sim_game` reach, 168 saat) 1. saatte ~1,1×10¹⁰ m, 48. saatte ~2,8×10¹³ m,
  bir haftada ~2,9×10¹⁴ m gider; tavan bunun hâlâ çok üstündedir. Eski kurallarla ilerlemiş kayıtlar artık günlerce yaşlı olduğu
  için tavanları (yol ∝ süre²) onları da kapsar. Oyun tarayıcıda çalıştığı için sahtecilik
  tamamen önlenemez, ama tek istekle listenin zirvesine çıkılamaz.
- Aynı kaydı en sık 5 saniyede bir yazar. 30 gün görünmeyen ve toplamda 1 km'ye ulaşmamış kayıtlar ara sıra silinir; yol gitmiş
  gezginler tüm zamanlar listesi için kalır.
- Ad sunucuda da aynı kuralla temizlenir ve denetlenir; tek harfin üstüne en çok 3 birleşen işaret (aksan vb.) yığılabilir,
  böylece Hintçe gibi yazılardaki adlar geçer ama yığılan işaretler sahnedeki etiketi taşıramaz.
- Tüm zamanlar sorgusu `life` sütununa göre sıralar (`life ≥ dist` her zaman sağlanır: 0006 göçü, `lifeOk ≥ distOk`, `MAX`),
  böylece `players_life` dizini kullanılır.

Yerelde API ile denemek için:

```bash
npx wrangler d1 migrations apply idle-traveler --local
npx wrangler dev   # http://localhost:8787
```

Şemaya yeni tablo eklenince canlı veritabanına uygulamak için `npx wrangler d1 migrations apply idle-traveler --remote`.

## Oyun

- **Başlık çubuğu**: Sayfanın üstünde oyunun adı, sürüm numarası ve *Yenilikler* düğmesi ile ayarlar (dişli), kartpostal,
  tema (gündüz/gece) ve ses düğmeleri durur. Ayarlar penceresinde dil, birimler, ses efektleri, ortam sesi, gökyüzü ve
  yolculuğu sıfırlama bulunur. Dar telefonlarda yalnızca logo, sürüm ve düğmeler kalır.
  **Ses manzarası (v1.55)**: Ortam sesi bölgeye göre değişir (`audio.js` → `ambient`): kıyıda (Ege Sahil Yolu, Zeytin
  Bahçeleri) yaklaşık 7 saniyede bir kabarıp inen alçak bir deniz hışırtısı; çiçekli ovalarda gündüz 5–14 sn arayla kuş
  cıvıltıları, gece (ovalarda ve kuru bölgelerde) cırcır böceği trilleri; çam ormanı ve sonbahar korusunda gündüz uzaktan
  ağaçkakan tıkırtısı; çöl, kanyon ve peri bacalarında kabarıp sönen kuru esintiler; karlı bölgelerde ince bir rüzgâr ıslığı,
  Kuzey Işıkları'nda gece yumuşak bir ışıltı; uzayda derin, sessiz bir uğultu. Yağmurda ve uzayda olaylar susar. Hepsi ortam sesi
  ayarına bağlıdır; sürekli katmanlar saniyede dört kez güncellenir. Testi: `tests/ambient.js`.
  Efektlerin yankısı ana çıkışa gider (ortam sesi kapalıyken de duyulur); iOS'ta bir kesintiden (arama, kilit ekranı) sonra ses
  ilk dokunuşta yeniden başlar.
- **Yenilikler**: Sürüm düğmesi her sürümde neyin değiştiğini tarihleriyle gösterir. Oyuncunun henüz görmediği bir sürüm
  yayınlandığında düğmede turuncu bir nokta belirir ve kısa bir bildirim gelir; pencerede yeni sürümler işaretlidir.
  Yeni oyuncular eski sürüm notlarını "yeni" olarak görmez.
  Yenilikler, Ayarlar ve Kartpostal pencereleri dışına basınca ya da Esc tuşuyla kapanır (tanıtım penceresi düğmeyle kapanır).
  Pencere açıkken arkadaki sayfa (`.app`, `inert`) klavyeyle de ulaşılamaz.
- **Kendiliğinden güncelleme**: Oyun yayındaki sürümü açılıştan 30 saniye sonra, sonra 3 dakikada bir ve sekmeye dönünce
  yoklar (`js/changelog.js` önbelleksiz okunur, `IT.VERSION` karşılaştırılır). Yeni sürüm varsa "Yeni sürüm hazır" bildirimi
  gelir, 4 saniye sonra ilerleme kaydedilir ve sayfa yumuşakça solarak yenilenir. Sekme arka plandaysa hemen yenilenir. Açık bir
  pencere (ör. ad yazılırken) kapanana kadar beklenir. Aynı sürüm için yalnızca bir kez denenir (`sessionStorage`), böylece
  önbellekten eski dosya gelse de sayfa döngüye girmez. Dosyadan (`file://`) açılan oyunda yoklama yapılmaz.

- **Yakınlaştırma**: Sahnenin sağ altındaki ＋/− denetimiyle sahne %80, %100, %125 ve %160 arasında yumuşakça yakınlaşır ya da
  uzaklaşır (bilgisayarda fare tekerleği sahnenin üstündeyken, ya da + / − tuşları). Sahne gerçek boyutun 1/zoom katı bir
  "sanal ekrana" çizilip ölçeklenir: gökyüzü, dağlar ve yolun yeri ekranda sabit kalır; yakınlaşınca yolcu ve çevresi büyür,
  uzaklaşınca daha geniş bir manzara ve daha çok gezgin görünür. İsim etiketleri, balonlar ve uçan yazılar uzaklaşınca küçülmez.
  Dokunuşlar sanal koordinata çevrildiği için kelebek, yıldız, sandık ve yadigâr her kademede yakalanır. Ortadaki noktalar seçili
  kademeyi gösterir; seçim kaydedilir. Geniş ekranda denetim konuşma düğmesinin üstünde dikey, telefonda solunda yataydır.
  Yatay telefonda bu iki düğme sahnenin üstünde, yolun şeridinde durur: tilki, hazine sandığı ya da yadigâr onların altına
  düşerse düğmeler yumuşakça solar ve dokunuşu sahneye geçirir (dokunuş düğmeye değil yakalanacak şeye gider); o kalkınca geri gelirler.
- **Telefon yerleşimi (v1.56)**: Telefonda (genişlik ≤ 860 px) sahnenin üstünde hiç yazı yoktur; sahne yalnızca manzaradır
  (`game.js` → `arrange`, `scene.textless`).
  - *Dikey*: sahne ekranın büyük kısmını kaplar; altında bir pano (`#dock`) durur: durum satırı (bölge, mesafe, hız, araç ve kredi;
    bildirimler ve "yeni bölge" afişi de birkaç saniye bu satırda akar, sonra durum yumuşakça geri gelir), etki çipleri, ritim ve
    durak şeridiyle yakınlaştırma ve konuşma düğmeleri, en altta sekmeler. Panoya dokunmak adım saymaz. Panel alttan açılan bir
    sayfadır: sekmeye dokununca sekme çubuğunun hemen üstüne kadar açılır (açıkken başka sekmeye geçilebilir, aynı sekmeye yeniden
    dokununca kapanır); tutamaçtan aşağı çekince, tutamaçtaki düğmeyle, arkadaki karartmaya dokununca ya da Esc ile kapanır. Sayfa
    açıkken de üst çubuk (ayarlar, kartpostal, tema, ses) kullanılabilir.
  - *Yatay*: sahne solda, panel sağda; pano panelin üstündedir (durum satırı, etkiler, ritim ve durak). Yakınlaştırma ve konuşma
    düğmeleri yazısız oldukları için sahnede kalır.
  - Sahnenin içinde harf ya da rakam içeren uçan yazılar ("+2 cm", "Yunuslar!"), gezgin ad etiketleri ve yol tabelaları çizilmez;
    konuşma balonlarında yalnızca mesajın emojisi kalır, yazısı durum satırında görünür. Konum kartı sahnenin üstünde olmadığı için
    uçan araçlar, kuşlar ve takımyıldızlar gökyüzünün tamamını kullanır.
  - *Katlanır kartlar* (her ekranda): sahip olunan araçlar ve güçlendirmeler kapalı başlar (ad, seviye, düğme); karta ya da sağdaki
    oka dokununca tanıtım, hızlar ve sonraki eşik yumuşakça açılır. Sıradaki alınacak araç ve Eve Dönüş kartı hep açıktır, yol
    arkadaşı kartı (seçici) ilk açılışta açık başlar. Açık kartlar tarayıcıda hatırlanır (`idle-traveler-open`, kayda girmez).
  Bütün bunları `tests/layout.js` denetler.
- **Adım at**: Sahneye dokun ya da Boşluk tuşuna bas. Hızlı ve ritmik tıklamalar *Ritim* bonusunu doldurur (telefonda da
  sahnenin altında küçük bir kutuda görünür). Art arda atılan adımların mesafesi tek bir büyüyen yazıda toplanır.
- **Araçlar**: Yürüyüş → Paten → Kaykay → Bisiklet → At → Motosiklet → Araba → Karavan → Tren →
  Sıcak Hava Balonu → Uçak → Süpersonik Jet → Roket → Güneş Yelkeni → Kuyruklu Yıldız → Yıldız Gemisi → Yıldız Balinası →
  Samanyolu Treni → Anka Kuşu → Zaman Makinesi (20 araç). Kuyruklu Yıldız ve Yıldız Gemisi v1.36'da, balina, tren ve Anka v1.46'da,
  Zaman Makinesi v1.50'de zincirin sonuna eklendi (her biri hız ×2,5, fiyat ~×11); erken ve orta oyunun dengesi değişmedi.
  **Zaman Makinesi** garajdayken (hangi araca binilirse binilsin) yolcunun yerine otomatik adım atar: saniyede `Econ.autoRate`
  kadar (Sv. 0'da 1, her seviye +0,05, Sv. 220'de en çok 12). Her otomatik adım bir dokunuşun yolunu verir (ritim çarpanı
  ve şanslı adım olmadan); elle atılan adım, ritim, rozet ya da Günün Notları için sayılmaz. Yalnızca oyun açıkken çalışır
  (çevrimdışı ilerleme ayrı hesaplanır). Yazısı birikip saniyede bir "⏱ +…" olarak uçar, ince bir saat tıkırtısı duyulur ve
  makinenin kristal kolu her tıkta oynar. Garaj kartında "Otomatik adım n/sn" satırı, Yol Defteri'nde *Otomatik adımlar*
  sayacı (`autoSteps`) görünür. Uzun yolculuklarda (eve dönüş eşiği her dönüşte
  3 katına çıktığı için) yeni hedef olurlar. *Garaj Sahibi* rozetinin son kademesi (Elmas) v1.48'de
  19 araca çıktı (v1.36'da 13 ve 14'ten 14 ve 16'ya yükselmişti); kazanılmış kademeler düşmez.
  Her aracın kendi yükseltme hattı var. Her seviye +%10 hız verir; Sv. 25, 50, 100 ve 150'de hız ikiye katlanır
  (en büyük sıçrama Sv. 50'de). Geç oyun için daha büyük eşikler var (v1.51'de eklendi, v1.56'da yeniden düzenlendi): Sv. 200 ve
  250'de ×3, 300 ve 350'de ×4, 400 ve 450'de ×5, 500'de ×10 (`Econ.boostOf`). Aracın hız çarpanı (1 + 0,1 × seviye) × eşik katlarının
  çarpımıdır: Sv. 150'de 256, Sv. 200'de 1.008, Sv. 300'de 17.856, Sv. 400'de 472.320, Sv. 500'de ~29,4 milyon. Yükseltmeler seviye başına %9,5
  pahalandığı için bu eşikler orta oyunun temposunu değiştirmez (araçlar yine Sv. 50 civarında değiştirilir); zincirin sonuna
  gelen oyuncuya eski araçlarını geliştirmek için yeni hedefler verir. Yükseltme satırı sıradaki eşiği ve katını söyler
  (yeni görünüm, hız ×2 … ×5); birden çok eşik birden ya da ×3 ve üstü bir eşik geçilince bildirim toplam katı yazar.
- **Fiyat dengesi (v1.27)**: Kilit yoktur, sıradaki araç her zaman alınabilir; oyuncuyu fiyatlar yönlendirir. Araçların satın alma
  ve yükseltme fiyatları sabittir; bir aracı yükseltmek başka bir aracın fiyatını değiştirmez. Yükseltmeler aracın fiyatının
  %1'inden başlar ve her seviyede yalnızca %9,5 pahalanır. Araç hızları 2,5 katlık, fiyatları ~6 katlık ve giderek dikleşen bir
  zincirdir. Bu yüzden en kârlı yol, aracı Sv. 50 civarına getirip sonra yenisine geçmektir. Araç kartlarında ipucu satırı yoktur.
  Ayar `tests/sim_switch.js` ile yapıldı: her an kredi başına en çok hız getiren alımı seçen oyuncu araçları Sv. 44–62 arasında
  bırakır. Hiç yükseltme yapmadan araca biriktiren oyuncu ata 6,5 saatte, yükselten oyuncu 44 dakikada ulaşır.
- **Tempo**: Dokunuşların etkisi v1.27'de yarıya indi. Gerçek tempo `tests/sim_game.js` ile ölçülür: oyundaki bütün kazanç
  kaynaklarını (ritim, şanslı adım, kelebekler, gökkuşağı, kayan yıldız, hazine sandığı, bölge/durak ödülleri, yadigârlar,
  rozetler, güçlendirmeler) saniye saniye işler. Simülasyondaki oyuncu kredi başına en çok kalıcı gelir getiren alımı yapar;
  Kelebek Dostu, Rüya ve Kamp'ı fiyatları son 60 saniyelik gelirini aşmayınca alır (v1.38'e kadar bunları hiç almıyor, Şans'ı
  da yanlışlıkla değersiz sayıyordu; önceki sürümlerde yazan tempolar bu yüzden gerçekte olduğundan 2,5–10 kat yavaştı).
  Tek yolculukta araçlara ulaşma, ortanca (8 deneme), v1.39. Hedefler v1.27'den beri belgelenenlerdir; v1.39'da gerçek tempo
  bu hedeflere geri çekildi (bkz. aşağıda):
  - **Şanslı + aktif** (2,5 dokunuş/sn ritimle, her olayı yakalar, her zar iki denemenin iyisi), gün döngüsünde (%44 gece):
    tren ~10 dk, uçak ~29 dk, jet ~76 dk, roket ~3,1 saat (181–195 dk), Güneş Yelkeni ~8 saat (462–490 dk), Kuyruklu Yıldız
    ~23 saat. Hep gece (koyu tema): Güneş Yelkeni ~450 dk; hep gündüz (açık tema): ~504 dk. Yıldız Gemisi tek yolculukta
    30 saatte ulaşılamaz; hatıralarla hızlanan sonraki yolculukların hedefidir (`sim_trips.js 14 0.5`: olaysız oyuncu
    Kuyruklu Yıldız'a 14. yolculukta ulaşır).
  - **Aktif** (aynı, normal şans): tren ~15 dk, uçak ~46 dk, roket ~4,6 saat, Güneş Yelkeni ~12,7 saat.
  - **Sıradan** (0,3 dokunuş/sn, olayların yarısını yakalar): motor ~14 dk, tren ~1 saat, uçak ~3,9 saat, roket ~20,6 saat.
  **Ölçüm geçmişi:** v1.38'e kadar simülasyon Kelebek Dostu'nu hiç almıyor, Şans'ı da yanlışlıkla değersiz sayıyordu. Gerçek
  tempo bu yüzden yazılandan çok hızlıydı (aynı düzeltilmiş simülasyonla Güneş Yelkeni: v1.36 kurallarında şanslı oyuncu ~37 dk,
  aktif ~93 dk; v1.38'de ~177 ve ~214 dk). Asıl hızlandırıcı Kelebek Dostu'ydu: 10. seviyede kelebekler iki kat sık, etkileri
  2,5 kat uzun geliyor, üst üste binen etkiler katlanıyordu (Rüzgâr Hortumu ×3 → ×21). v1.39'da Kelebek Dostu seviye başına
  +%5 sıklık ve +%5 süreye indi (10. seviyede +%50 / +%50), gelire bağlı ödüller de yeniden seçildi.
- **Gelire bağlı ödüller**: Bölge (120 sn), durak (90 sn), kelebekten anında kredi (250 sn), hazine sandığı (2200 sn)
  ve günün hediyesi (120 sn × gün) **kalıcı gelirin** o kadar saniyesini verir (`game.js` → `REWARD`, `sim_game.js` → `RW`).
  Kalıcı gelir, geçici çarpanlar (kelebek etkileri, gökkuşağı, dilek, kervan) olmadan hesaplanan kredi/sn'dir (`baseEma`).
  v1.37'den önce ödüller şişmiş gelirle hesaplanıyordu: dilekle (kredi ×10) düşen dördüncü harita parçasının sandığı on kat,
  gökkuşağı ile Rüzgâr Hortumu'nun (×30 hız) üst üste geldiği anlardaki bölge ödülleri otuz kat veriyordu; tempo bu rastlantıya
  bağlıydı (sıradan oyuncu trene 4 ile 72 dk arasında ulaşıyordu). Süreler v1.39'da `sim_game.js` ızgarasıyla, yukarıdaki
  hedefleri üç profilde birden tutturacak biçimde seçildi (bölge ve durak ödülleri erken oyunu, sandık geç oyunu taşır).
  Simülasyonda denemek için: `'{"rw":{"chest":3000},"bf":{"bfFreq":0.1}}'`; v1.37 öncesi kural için `'{"boost":1}'`.
  `sim_switch.js` ve `sim_trips.js` olayları saymaz, yalnızca garaj dengesini karşılaştırmak içindir.
- **Yolcular (çok oyunculu)**: Giriş penceresinin son maddesi diğer gezginleri, el sallamayı ve mesaj balonunu tanıtır.
  Oyuna başlarken gezgine adı sorulur (2–20 karakter; harf, rakam, boşluk ve . _ ' -).
  Adı olmayan eski oyunculara da bir kez sorulur, Ayarlar'dan değiştirilebilir. Panelin dördüncü sekmesi **Yolcular**
  son 24 saatte oynayan gezginleri listeler: önce şu an yolda olanlar (sen dahil), ince bir "Daha önce yoldaydı" ayırıcısının
  altında diğerleri; her grup bu yolculukta gidilen yola göre sıralıdır. Sekmenin üstündeki "Son 24 saat | Tüm zamanlar" seçimiyle
  tüm zamanlar listesine geçilir: şimdiye kadar yola çıkmış bütün gezginler, bütün yolculuklarında gittikleri toplam yola göre
  (yoldakilerin yanında yeşil nokta). Bu liste istendiğinde getirilir ve sekme açıkken dakikada bir tazelenir; seçim kaydedilir. Sunucu da ilk 50'yi bu kuralla seçer, böylece yoldaki hiç
  kimse listeden düşmez; ilk 50'de olmayan kendi satırın yoldakilerin sonuna eklenir. Her satırda ad, bindiği araç,
  kaçıncı yolculukta olduğu, mesafesi ve şu an yolda olup olmadığı görünür. Sekmedeki sayı şu an yolda olanlardır
  (son 3 dakikada haber verenler). Oyun her 30 saniyede bir kaydını günceller. Sunucuya ulaşılamazsa oyun aynen sürer,
  liste "ulaşılamıyor" der ve kendiliğinden yeniden dener.
- **Gezginler sahnede**: Şu an yolda olan diğer oyuncular sahnede, yolun arka şeridinde yarı saydam yolculuk eder.
  Senden öndekiler sağda, gerideki solda durur (geniş ekranda en çok 3 önde ve 2 geride, telefonda 1+1). Her biri kendi
  aracı, kıyafeti, aracının görünüm aşaması ve yol arkadaşıyla çizilir. İsim etiketi kimin ne kadar önde ya da geride
  olduğunu gösterir (birkaç metre yakınsa "yanında"). Etiketler gece örtüsünün üstünde çizilir ve karanlıkta lacivert tona
  geçer; yan yana gelen etiketler birbirine değmez, biri yumuşakça yukarı kalkıp ince bir çizgiyle gezgine bağlanır.
  Yeni gelen gezgin süzülerek belirir, ayrılan solar. Bir gezgine dokununca ona el sallarsın: 👋 kendi
  başında belirir, bildirim onun kaçıncı yolculuğunda ve ne kadar önde ya da geride olduğunu söyler. El sallama o oyuncuya
  iletilir: onun sahnesinde senin başında 👋 ve küçük bir sıçrayış görünür, "… sana el salladı! Dokunup karşılık
  verebilirsin" bildirimi gelir; yoldaki diğer oyuncular yalnızca 👋 balonunu görür. Ayarlar'daki "Diğer gezginler sahnede" seçeneğiyle gizlenebilir.
  Gezginler aracının gerçek genişliğine göre dizilir: kendi aracından (vagonlar ve köpek dahil) başlayıp aralarında boşluk
  bırakarak öne ve geriye doğru; yerde ve gökyüzünde iki ayrı sıra vardır, sığmayan gezgin gösterilmez. Diğer gezginlerin
  treni lokomotif ve tek vagonla çizilir, böylece beş kişi aynı anda trende olsa da yol kalabalıklaşmaz. Araç genişlikleri
  (`VEH_EXT`) ve yükseklikleri (`VEH_TOP`) araçlar tek tek çizilip piksel piksel ölçülerek bulundu.
- **Kervan**: Şu an yolda olan ve sana yakın (yolunun %15'i, en az 10 km içinde; v1.27'den önce %3 ve 2 km) her gezgin hızını %10 artırır, en çok 3
  gezgin (+%30). Sahnenin sol üstünde süresiz bir "🐫 Kervan" etkisi görünür, kervandaki gezginlerin isim etiketinde de 🐫 durur; kervana ilk katılınca bildirim gelir (en sık
  2 dakikada bir). Kervandan ayrılmak için pencerenin %25 dışına çıkmak gerekir, böylece sınırdaki gezgin yüzünden etki
  yanıp sönmez. Yalnızca canlı oyunda geçerlidir, çevrimdışı ilerlemeye eklenmez. Sürüm notunda yalnızca ipucu verilir.
- **Canlı mesafeler**: Her oyuncu bildirimde hızını da (`spd`, m/sn) gönderir; sunucu hızı da makullük tavanına bağlar (tek
  bildirimde tavanın 1/30'u, yeni kayıtta ≈2,6e6 m/sn; hızlı araçlara ancak saatler sonra ulaşılır, tavan da kaydın yaşıyla büyür), yoksa sahte bir hızla 3 dakika liste başı olunurdu.
  İki bildirim arasında diğer gezginlerin mesafesi bu hızla tahmin edilir (en çok 3 dakika), böylece sahnedeki etiketler ve Yolcular listesi canlı akar; liste
  açıkken iki saniyede bir tazelenir ve sıra tahmini mesafeye göre yeniden kurulur.
- **Hazır mesajlar**: Sahnenin sağ altındaki konuşma düğmesi 9 hazır mesaj açar (👋 Merhaba!, 🌄 Ne güzel manzara!, 🚀 Haydi,
  yola devam!, ✋ Bekle beni!, 🏁 Yarışalım mı?, ⭐ Harika gidiyorsun!, 💛 Teşekkürler!, ☕ Mola zamanı., 🌙 İyi yolculuklar!).
  Mesaj ve el sallama sunucuda aynı 4 saniyelik aralığı paylaşır; istemci de tek bekleme kullanır (konuşma düğmesinin
  çevresindeki halka ikisinden sonra da 5 saniye dolar, bu sırada el sallanırsa kısa bir red sesi gelir). Gelen el sallama
  listedeki son mesajı silmez, ama gezgin mesajdaki gibi sahnede öne alınır.
  Seçilen mesaj yolcunun başının üstünde 8 saniyelik bir konuşma balonu olur; diğer oyuncuların sahnesinde de o gezginin
  başında görünür (kısa bir ses ve küçük bir sıçrayışla). Sunucu yalnızca mesajın kimliğini saklar, her oyuncu metni kendi
  dilinde görür; serbest metin yoktur. Mesajlar arasında 5 saniye bekleme vardır (düğmenin çevresinde azalan bir halka).
  Yatay telefonlarda (alçak sahne) mesaj seçici beş sütunlu iki sıraya geçer, böylece taşmaz.
  Az önce konuşan gezgin sahnede öncelikle gösterilir; Yolcular listesinde son bir dakikanın mesajı adının altında yazar.
  Yolda başka gezgin varken ve sekme açıkken mesajlar 6 saniyede bir yoklanır; yalnızken hiç istek atılmaz.
  Mesaj sesi yalnızca konuşan gezgin sahnedeyse (ya da gezginler gizliyken bildirim gösterilince) çalar; gizli sekmede gelen
  mesaj ve el sallama sesleri birikip sekmeye dönünce hep birden çalmaz. Adı olmayan yolcu el sallamak isteyince önce ad
  penceresi açılır (önceden el sallandı gibi görünüp sunucuya hiç gitmiyordu). Yolcular sekmesinde klavye odağı varken liste
  iki saniyede bir yeniden kurulmaz (odak kaybolmasın). Tüm zamanlar listesinde kendi satırın sunucudaki toplamla bu kaydınkinin
  büyüğünü gösterir: sunucu toplam yolu hiç azaltmadığı için yolculuğu sıfırlayan oyuncu listede 0 m görünmez.
- **Araç görünümleri**: Yükseltmeler aracı görünür biçimde geliştirir. Seviye 10, 25, 50, 100, 150 ve 200'de her araç yeni
  bir görünüm kazanır (25'ten sonrakiler aynı zamanda hızın ikiye katlandığı eşikler); 100. seviyede altın süsler ve parıltı gelir.
  150. seviyede aracın arkasından kıyafet renklerinde yıldız tozu izi akar, 200. seviyede buna dalgalanan bir gökkuşağı kuyruğu
  eklenir (trende iz lokomotifin bacasından çıkıp vagonların üstünden akar). v1.52'den beri iki aşama daha var: Sv. 300'de aracın
  çevresinde ince bir yörünge çizgisi üstünde kıyafet ve altın renklerinde altı yıldız döner (yıldızlar aracın önünden ve
  arkasından geçer), Sv. 500'de arkada yavaşça dönen ışık huzmeleri belirir (gündüz daha soluk) ve yörüngedeki yıldızlar
  iri ve kısa ışık kuyruklu olur (`scene.js` → `aura`). Sv. 300 hem ×3 hem yeni görünüm olduğu için bildirim "hızı 3 katına
  çıktı ve araç yeni bir görünüm kazandı" der. Diğer gezginlerin görünüm aşaması sunucuda 0–8 arası kabul edilir. Garaj simgelerinde bu aşamalar köşelerdeki altın
  yıldızlar ve aracın arkasındaki minik gökkuşağı yayıyla görünür; diğer gezginler ve Yolcular listesindeki simgeler de bu
  görünümle çizilir. Örnekler: yürüyüşte sopa, atkı ve
  şapka tüyü; patende dizlik; kaykayda boyalı tahta ve ışıklı tekerlek; bisiklette flama, altın jant ve heybe; atta saçaklı
  eyer örtüsü, yeleye örülü kurdele ve heybe; motosiklette rüzgâr camı, şerit ve çanta kutusu; arabada yarış şeridi, altın jant
  ve sörf tahtası; karavanda çiçek desenleri, arkada bisiklet, güneş paneli ve ışık zinciri; trende bayrak, altın şerit ve
  dördüncü vagon; balonda flamalar, renkli zarf ve kum torbaları; uçakta kuyruk şeridi, kanatçık ve pankart; jette burun ucu,
  kanat şeridi ve art yakıcı; rokette şeritler, yan iticiler ve anten; güneş yelkeninde yıldız arması, yanardöner kenar ve
  ikinci yelken; kuyruklu yıldızda (yolcu buzlu kaya çekirdeğin sırtında oturup dizgin tutar) eyer örtüsü ve dizgin, buz
  kristalleri ve ikinci (toz) kuyruk; yıldız gemisinde (üstte ve altta pilonlu motor bölmeleri, kubbe kokpit, bir bükülme
  halkası) gövde şeridi ve lomboz ışıkları, ikinci ve üçüncü bükülme halkası ve konum ışıkları; yıldız balinasında (sırtı
  yıldız benekli, kuyruğu yavaşça iner kalkar, yolcu sırtında oturur) eyer örtüsü, sırttaki delikten yıldız tozu fıskiyesi ve
  yanlarında ışıldayan benek sırası; Samanyolu treninde (ışıktan rayda giden buharlı lokomotif ve bir vagon, bacadan yıldız
  tozu tüter, yolcu kabin penceresinden bakar) vagonda kıyafet renginde kuşak, vagon damında renkli fener dizisi, ışıldayan
  tekerlekler ve daha parlak ray; Anka kuşunda (Zümrüdüanka: zümrüt tüyler, altın karın, ışıktan uzun kuyruk telleri, ağır
  ağır çırpan kanatlar) eyer örtüsü ve altın dizgin, kuyruk tüylerinde göz benekleri ve iki tel daha, kanat kenarlarında
  ışıldayan alev; zaman makinesinde (pirinç kızaklar, kadife koltuk, arkada dönen kadranlı saat diski, ucu kristal kol) pirinç
  fener ve kıyafet renginde minder, diskin altında dönen ikinci çark ve arkada dönen zaman girdabı. Garaj simgeleri aracın o anki görünümünü gösterir; yükseltme satırı yeni görünümün geleceği seviyeyi söyler.
  At dörtnal (kanter) koşar: her bacak yere basar (toynak yerde kalır) ve havada katlanıp öne gelir; ön dizler öne, arka diz
  eklemleri geriye bükülür. Gövde adım başına bir kez yükselir, baş ve boyun adımla sallanır, yele telleri ve kuyruk rüzgârda
  dalgalanır, kulak ara sıra seğirir. Binici atı biraz gecikmeyle izler, dizgin başa uzanır; toynaklar yere vurdukça toz kalkar.
  Bisiklette pedallar krank kollarıyla aynakol dişlisine bağlı döner (dişliden arka göbeğe zincir uzanır), ayaklar pedallara basar;
  binicinin omuzları ve başı her pedal vuruşunda hafifçe iner ve yana salınır, sepetteki çiçekler sallanır.
  Uçan araçlar yolun üstünde gökyüzünde süzülür, yol ve manzara görünmeye devam eder. Roket ve güneş yelkeninde gökyüzü koyulaşır, yıldızlar belirir.
  Uçan araç konum kartının altında kalır (`scene.flyY`; game.js kartın alt kenarını verir, araç yumuşakça izler): v1.46'ya kadar
  dikey telefonda kart gökyüzünün üst yarısını kapladığı için uçan araçlar ve uçan gezginler kartın arkasında kalıyordu.
  Kartın alt kenarı açılışta da ölçülür (araç ilk karede doğru yerde belirir). Uçan bir gezgin kartın altına denk gelirse
  etiketi ve balonuyla birlikte kartın altına iner; kartın kenarında yumuşakça geçiş yapar.
- **Yol tecrübesi**: Hızını garajdaki en güçlü araç belirler, diğer araçlar hızlarının yarısını katar. Yeni araca her zaman
  hemen binilir. Hangi araca bindiğin yalnızca görünümü değiştirir; hız asla düşmez, eski yükseltmeler boşa gitmez.
  Garajın üstündeki iki özet kutusu en güçlü aracı ve diğer araçlardan gelen hızı canlı gösterir.
- **Sabit düğmeler**: Fiyatlar, seviyeler ya da en güçlü araç değiştikçe garaj ve güçlendirme kartlarındaki düğmeler yerinden
  kaymaz. Düğmeler sabit genişliktedir, değişen değerler kendi satırında durur. Böylece aynı düğmeye art arda basılabilir.
  Araç kartında yükseltme satırı simgenin altında kartın tam genişliğini kullanır; 320 piksellik telefonlarda da sığar.
  Yükseltme adı kesilmez, kendi satırında en çok iki satıra iner; seviye etiketi altında durur. Böylece seviye kaç basamaklı
  olursa olsun ad aynı yerden kırılır. Dar telefonlarda eşik ipucuna üç satırlık yer ayrılır: seviye artınca kart büyümez.
- **Toplu yükseltme**: Garajın üstündeki ×1 / ×10 / Maks seçimiyle tek dokunuşta birden çok seviye alınır.
- **Güçlendirmeler**: Güçlü Adımlar, Arkadan Esen Rüzgâr, Kartpostal Koleksiyonu (kredi), Yolun Ritmi,
  Şanslı Adım (seviye başına %1 ihtimalle 5 kat uzun adım), Rüyada Yolculuk (çevrimdışı hız), Uzun Mola (çevrimdışı süre), Kelebek Dostu.
  İlk üçü tavansızdır (her seviye 2,2–2,6 kat pahalanır, alınabilen seviye gelirin logaritmasıyla artar: 24 saatte ~25–30 seviye).
  v1.56'dan beri bu üçünün etkisi araçlardaki gibi eşiklerde katlanır: (1 + seviye başına %20/%25 × seviye) × Sv. 25, 50, 100
  ve 150'de ×2, Sv. 200'de ×3 (Güçlü Adımlar Sv. 25'te +%1.100, Sv. 100'de +%16.700). Kartın "sonraki seviye" satırı sıradaki
  eşiği de gösterir (`ui.buffBoost`). v1.58: seviye rozetinde beş eşik noktası (ulaşılan altın, sıradaki yavaşça yanıp söner;
  Sv. 200'de rozet altın olur). Eşiği geçen alım altın bildirim (`toast.buffBoost`), ses, sahnede parıltı ve kartın bir kez
  altınla parlamasıyla kutlanır. Sıradaki durağın adı kutuya sığmazsa kırpılmaz, kenarları solarak yavaşça kayar.
  Tavanlı olanlar v1.38'de dikleşti (büyüme: Ritim ×4, Şans ve Rüya ×4,5, Kamp ×2,3, Kelebek Dostu ×5, Yol Arkadaşı ×6). Son
  seviyeleri artık minibüs ile uçak arasındaki fiyatlarda (Ritim ~79 Mn, Kelebek Dostu ~3,5 Mr, Yol Arkadaşı ~50 Mr); önceden
  hepsi ~3 Mr tutuyordu ve aktif oyuncu ilk 10 dakikada bitiriyordu. Sıradan oyuncu onları ilk ~3 saate yayar.
  Kelebek Dostu seviye başına kelebekleri %5 sık getirir ve etkilerini %5 uzatır (v1.39'a kadar %10 ve %15).
- **Bölgeler**: Sabah Köyü, Lavanta Tarlaları, Çam Ormanı, Altın Buğday Ovası, Ege Sahil Yolu, Kızıl Kanyon,
  Kiraz Çiçeği Vadisi, Sonbahar Korusu, Vaha Yolu, Karlı Geçit, Kuzey Işıkları, Rize Çay Bahçeleri, Peri Bacaları,
  Lale Bahçeleri (yel değirmenleri), Zeytin Bahçeleri (deniz kıyısında zeytinlikler)… Liste bitince bölgeler ikinci tura girer;
  her yeni bölge öncekinden 3 kat uzaktadır. Her yeni bölge pasaporta bir damga ekler ve kalıcı olarak +%6 hız verir.
- **Duraklar**: Kapının önü (10 m), Bir stadyum turu, Maraton, Ultra maraton (100 km), İstanbul – Ankara, Dünya turu,
  Ay'a varış, Proxima Centauri… gibi gerçek mesafeler.
- **Gerçekçi mesafeler**: v1.11'de bütün mesafeler 1/10'a indi (yürüyüşte adım başına birkaç santimetre, atla birkaç on km/sa).
  Metre başına kazanılan kredi 10 katına çıktığı için tempo aynı kaldı: araçlar, yükseltmeler, bölgeler ve eve dönüş eskisiyle
  aynı sürede gelir. İlk saatin durak ritmi de korunur. Eski kayıtlar otomatik çevrilir; geçilmiş duraklar yeniden ödül vermez.
- **Geçici etkiler**: Kelebek, gökkuşağı ve kayan yıldız etkileri sahnenin solunda kalan süreleriyle durur; son 10 saniyede
  yumuşakça nabız atar, süresi bitince solup daralarak kaybolur (alttakiler birden yukarı zıplamaz). Telefonda bildirimler
  etkilerin altında belirir; yatay telefonda sahnenin sağ üstüne yaslanır, konum kartını örtmez. Bir kelebek etkisinin 5 dakikadan fazla süresi kalmışken aynı kelebek yeniden yakalanırsa süre değil
  çarpan artar: her kat temel artışı bir kez daha ekler (Rüzgâr Hortumu hız ×3 → ×5 → ×7, Bereket kredi ×2 → ×3 → ×4),
  en çok 10 kat. Kalan süre 5 dakikanın altındaysa yakalanan kelebek süreyi uzatır.
- **Altın kelebek**: Arada bir gökyüzünden geçer. Yakalarsan hız ×3, kredi ×2, tıklama ×5 ya da anında kredi verir.
- **Kayan yıldız**: Gece gökyüzünde (ya da uzayda) ara sıra bir yıldız kayar. Dokunup dilek tutarsan 20 saniye boyunca
  *Yıldız Tozu* etkisiyle kredi ×10 olur. Yağmurlu gecelerde yıldız kaymaz.
- **Karahindiba tohumu**: Aydınlık, yağmursuz gündüzlerde (uzayda değilken) ara sıra rüzgârda bir karahindiba tohumu sağdan sola
  süzülür (15 sn; ilk 40–80 sn, sonra 80–190 sn arayla). Dokunup üflersen tohumları savrulur, dilek tutmuş olursun: 20 saniye
  boyunca *Rüzgâr Dileği* etkisiyle kredi ×10. Kayan yıldız gibi dilek sayılır (*Dilek Tut* rozetleri) ve %50 olasılıkla harita
  parçası düşürür. Açık temada (hiç gece yaşamadan) oynayan da böylece dilek tutabilir. Sürüm notunda yalnızca ipucu verilir.
- **Günün hediyesi**: Her yeni günün ilk ziyaretinde kredi hediyesi gelir (yaklaşık 2 dakikalık gelir). Üst üste gelinen her gün
  hediyeyi büyütür, 7. günde en yüksek düzeye ulaşır. Bir gün atlanırsa seri yeniden başlar. Oyun açıkken gece yarısı geçerse
  hediye hemen gelir. Saat geri alınarak hediye alınamaz. Seri ve en iyi seri Yol Defteri'nde görünür.
- **Yol Defteri gezinme şeridi (v1.53)**: Defterin üstünde yapışkan, yatay kayan bir çip şeridi durur; yalnızca var olan
  bölümler (Günün Notları, Yolculuk, Kartpostal Albümü, Hazine haritası, Yadigârlar, Mektuplar, Gökyüzü Haritası, Kuş Defteri,
  Pasaport damgaları, Rozetler, Kıyafet) ilerleme sayılarıyla görünür. Çipe dokununca o bölüme yumuşakça kayılır (başlık şeridin
  altında durur, çip ve başlık kısa bir ışıkla karşılık verir); kaydırdıkça o an okunan bölümün çipi vurgulanır. Defter yeniden
  çizilince sayfanın ve şeridin kaydırması korunur; şeridin uçları solar. Testi: `tests/jnav.js`.
- **Günün Notları (v1.47)**: Her gün herkese aynı üç küçük hedef verilir (tarihten türetilen tohumla seçilir; `game.js` →
  `NOTES`): adım atmak (150), altın kelebek yakalamak (2), gökyüzündeki bir kuşa dokunmak, kartpostal çekmek, dilek tutmak
  (kayan yıldız ya da karahindiba), yükseltme almak (5), oyun açıkken 10 dakika yolculuk etmek (süre sayılır; v1.49'a kadar
  o anki hızla ~10 dakikalık yoldu, eve dönüşten sonra o gün tamamlanamıyordu) ve hasat mevsiminde bir balkabağına dokunmak. Kuş
  notu uzaya çıkan bir araçla (roket ve sonrası; kuşlar gelmez), balkabağı notu mevsim dışında ya da tarla dışı bir bölgede seçilmez.
  Saat geri alınınca notlar yeniden kurulmaz (ödüller tekrarlanmaz). Notlar Yol
  Defteri'nin başında ilerleme çubuklarıyla durur; tamamlanan not yeşil bir tikle işaretlenir. Her not kalıcı gelirin 60 sn'sini
  (en az 20 kredi), üçü birden 240 sn'sini daha (en az 60 kredi) verir. Yalnızca oyun açıkken sayılır, çevrimdışı yol sayılmaz.
  Yeni günün notları defterde görülene kadar Yol Defteri sekmesinde turuncu nokta yanar. Notlar `notes` alanında tutulur, eve
  dönüşte de kalır; bozuk ya da dünkü notlar yeniden kurulur. Testi: `tests/notes.js`.
- **Hazine haritası**: Yakalanan her altın kelebek %20, her dilek (kayan yıldız ya da karahindiba) %50 olasılıkla bir harita parçası düşürür. Dört parça
  tamamlanınca yolcunun önünde, yol kenarında parlayan bir hazine sandığı belirir (25 saniye kalır; kaçırılırsa 45 saniye sonra
  yeniden gelir). Sandık yaklaşık 37 dakikalık (2200 sn) kalıcı gelir kadar kredi verir (İpek Yolu'nda iki katı), harita sıfırlanır. Yol Defteri
  açılan parçaları ve bulunan hazine sayısını gösterir; *Hazine Avcısı* rozet ailesi bulunan sandıkları sayar.
- **Bahar yağmuru**: Yeşil bölgelerde ara sıra yağmur yağar. Gündüz yağmurun ardından gökkuşağı çıkar ve 20 saniye boyunca hız ×10 olur.
  Gece yağmurdan sonra ay ışığında soluk, gümüşi bir *ay gökkuşağı* çıkar (aynı etki, gökkuşağı sayılır): v1.42'ye kadar gece
  gökkuşağı çıkmadığı için koyu temada oynayan *Gökkuşağı* rozetlerini hiç kazanamıyordu. Sürüm notunda yalnızca ipucu verilir.
- **Yadigârlar**: Her bölgenin (biyomun) bir yadigârı var: köy balı, lavanta demeti, çam fidanı, başak demeti, deniz kabuğu,
  eski testi, kiraz çiçeği, kızıl yaprak, kum saati, kardan adam, yıldız dürbünü, çay fincanı, minik balon, lale ve nazar boncuğu.
  Yadigârı henüz bulunmamış bir bölgede yaklaşık 45–85 saniye sonra aracın önünde, yolun biraz üstünde parıldayan bir cam kabarcık
  belirir ("Yol kenarında bir şey parıldıyor…"). 20 saniye süzülür; kaçırılırsa 80–150 sn sonra yeniden gelir. Dokununca
  yadigâr rafa konur ve ömür boyu +%2 hız verir (15 yadigârla +%30). Eve dönüşte kaybolmaz. Yol Defteri'ndeki rafta bulunanlar
  bölgenin renginde durur (dokununca küçük bir sallanma ve ses), bulunmayanlar "?" ve bölgenin adıyla bekler. Bazı bölgelere ilk
  yolculukta varılamaz; onları başka rotalar erken gezer. *Koleksiyoncu* rozet ailesi bulunan yadigârları sayar, raf dolunca
  *Kâşif* kıyafeti açılır. Sürüm notunda yalnızca ipucu verilir.
- **Takımyıldızlar (gökyüzü haritası)**: Gece (ya da uzayda), yağmursuz gökyüzünde arada bir sıradaki bulunmamış takımyıldızın
  yıldızları diğerlerinden parlak, yumuşakça nabız atarak belirir (ilki 60–100 sn sonra, 45 sn kalır; kaçırılırsa 70–110 sn sonra
  yeniden; bulunduktan sonra sıradaki 150–250 sn sonra; Kuzey Yolu'nda iki kat sık; pencere açıkken gelmez). İlk kez "Gökyüzünde
  birkaç yıldız diğerlerinden parlak…" bildirimi gelir. Yıldızlara sırasız dokunulur: dokunulan yıldız parlar ve ikisi de yanan
  yıldızların arası ince bir çizgiyle (önce yanandan ötekine uzayarak) bağlanır; her dokunuşta yükselen bir çan notası çalar.
  Hepsi yanınca takımyıldız tamamlanır, bütün çizgiler parlar ve "gökyüzü haritana işlendi" bildirimi gelir. Bulunan takımyıldızlar
  ömür boyu (eve dönüşte de) gece gökyüzünde ince çizgilerle çizilir ve yıldızlarla aynı hızda kayar. Sekiz takımyıldız sırayla gelir:
  Büyükayı, Kraliçe (Kasiopeya), Avcı (Orion), Lir, Kuğu, Kartal, Küçükayı, Akrep (`data.js` → `CONSTELLATIONS`: birim kutuda
  yıldız yerleri ve çizgiler). Yol Defteri'ndeki *Gökyüzü Haritası* bölümü (ilk takımyıldızdan sonra görünür) bulunanları küçük bir
  yıldız çizimiyle, bulunmayanları "?" ile gösterir. Sekizincisi *Yıldız Haritacısı* kıyafetini açar. Geniş ekranda takımyıldız gökyüzünün
  sağ yarısında, dar telefonda konum kartının sağında belirir (kartın genişliği ölçülür); kutu her çizimde yeniden kurulduğu
  için yakınlaştırma ya da döndürme sonrası da ekranın içinde ve uzak dağların üstünde kalır. Gün ağarırsa yıldızlar yumuşakça
  solar. Turna sürüsü, kâğıt uçak ya da serbest uçurtma gökteyken gelmez, takımyıldız varken onlar da gelmez. Dokunuş sesleri
  dokunma sırasıyla yükselir. Ekonomiye etkisi yoktur. Sürüm notunda yalnızca ipucu verilir.
- **Yunuslar**: Denizli bölgelerde (Ege Sahil Yolu, Zeytin Bahçeleri) arada bir uzak denizden bir yunus sürüsü (1–3 yunus) yolcuyla
  aynı yöne yüzer: her yunus arayla sudan sıçrar, havada bir yay çizip yeniden dalar; çıkışta ve dalışta su damlaları sıçrar,
  suyun yüzünde ince halkalar yayılır (ilki bölgeye girişten 30–60 sn sonra, sonra 90–170 sn arayla; sürü ekranı 15 sn'de geçer;
  yağmurda, uzayda ve pencere açıkken gelmez). Gece yunuslar ay ışığında gümüşi görünür; sıçradıkları yerde ve suyun altında
  yüzdükleri izde deniz yeşilimsi mavi ışıldar (deniz ışıması). İlk iki sürüde "Uzakta, denizde bir şey sıçradı… Ufka bak!"
  bildirimi gelir. Sürüye dokununca yunuslar sırayla yüksek bir sıçrayışla havada takla atar, neşeli ıslıklar duyulur; her sürü
  bir kez sayılır ("Denizden n. selam"). Denizin yunuslara yer açması için kıyı bölgelerinde orta tepeler (kumsal) alçalır, deniz
  şeridi genişler. Yol Defteri'nde *Yunus selamı* sayılır; yedinci selam *Denizci* kıyafetini (deniz mavisi ceket, beyaz denizci
  şapkası, kırmızı çanta) açar. Kıyafet kilitliyken ilk selamdan önce yalnızca "Denizden bir selam…", sonra "Yunuslar: n/7" yazar.
  Ekonomiye etkisi yoktur. Sürüm notunda yalnızca ipucu verilir. Selam verilen yunus o anda havadaysa önce o sıçrayışını bitirir,
  selamdan sonra sıçrayışlar sudan yeniden başlar (v1.44'e kadar suya birden düşüyor, sonra havada beliriyordu). Deniz solarken
  (denizsiz bölgeye geçiş, uzay) görünmeyen sürüye dokunulmaz; denizli bir bölgeye her girişte ilk sürü 30–60 sn içinde gelir.
- **Kuş Defteri (v1.44)**: Her bölgenin kendine has bir kuşu var (`data.js` → `BIRDS`): Leylek (Sabah Köyü, Buğday Ovası),
  Arıkuşu (Lavanta, Lale, Kiraz), Alaca Ağaçkakan (Çam Ormanı, Sonbahar Korusu), Flamingo (Ege Sahil Yolu, Zeytin Bahçeleri),
  Kaya Kartalı (Kızıl Kanyon, Peri Bacaları, Çöl), Kar Baykuşu (Karlı Geçit, Kuzey Işıkları) ve Yalıçapkını (Çay Bahçeleri).
  Arada bir o bölgenin kuşu (ya da küçük sürüsü: leylek 1–2, flamingo 3–5, arıkuşu 2–3) gökyüzünden geçer: ilki 40–70 sn sonra,
  sonra 120–200 sn arayla. Her kuşun kendi uçuşu ve sesi vardır: leylek ve kartal arada süzülür (kartalın kanat uçları parmak
  gibi ayrıktır), arıkuşu ve ağaçkakan çırpıp süzülerek dalgalı uçar, yalıçapkını hızlı ve alçaktan geçer, leylekle flamingo
  yolcuyla aynı yöne, diğerleri karşıdan uçar; leylek gaga takırdatır, ağaçkakan tıklatır, baykuş öter. Gece de gelirler (açık ve
  koyu temada eşit); gece hafifçe kararır ve çevrelerinde soluk bir ışık olur, baykuşun gözleri ışıldar. Konum kartının altından
  uçarlar (telefonda da kartın arkasında kalmazlar). Yağmurda, uzayda, pencere açıkken ve gökyüzünde turna, uçurtma, kâğıt uçak
  ya da takımyıldız varken gelmezler; kuş gökteyken bunlar da beklenir. Kuşa dokununca dokunulan yerde dürbün biçiminde iki
  halka belirip solar, kuş sevinçle hızlanıp yükselerek kaybolur ve deftere yazılır (her geçiş bir kez sayılır). İlk iki kuşta
  "Gökyüzünde tanımadığın bir kuş var…" bildirimi gelir; yeni bir kuş "Kuş Defteri'ne yeni bir kuş: … (n/7)" der. İlk kuştan
  sonra Yol Defteri'nde *Kuş Defteri* bölümü görünür: bulunan kuşlar renkli çizimi, adı ve kaç kez görüldüğüyle, bulunmayanlar
  soluk siluet ve yaşadığı yeri sezdiren bir ipucuyla ("Kanyonların çok üstünde süzülür"). Defterdeki kuşa dokununca kendi
  sesiyle öter ve kartında hafifçe sıçrar. Yedi kuşun hepsini tanıyınca *Kuş Gözlemcisi* kıyafeti (haki ceket, hasır şapka,
  tuğla kırmızısı çanta) açılır; kilitliyken "Gökyüzüne bak…", ilk kuştan sonra "Kuşlar: n/7" yazar. Sayılar `birds` alanında
  ömür boyu tutulur. Ekonomiye etkisi yoktur. Sürüm notunda yalnızca ipucu verilir. Testi: `tests/birds.js`.
- **Hasat mevsimi (v1.45)**: Oyun gerçek takvime bakar (`data.js` → `festival()`). Ekim ve kasımda tarla bölgelerinin
  (Sabah Köyü, Lavanta, Buğday Ovası, Ege Sahil Yolu, Kiraz, Sonbahar Korusu, Çay Bahçeleri, Lale, Zeytin; `HARVEST_BIOMES`) yol
  kenarında arada bir balkabağı öbekleri, üstünde balkabağı duran saman balyaları ve (ova ve korularda) rüzgârda hafifçe sallanan,
  hasır şapkalı korkuluklar durur. Çoğu öbeğin en büyük balkabağı oyulmuştur: gündüz koyu oyuklar, gece içten yanan sıcak bir
  fener ve çevresinde titreyen bir ışık. Gece ay turuncuya çalar ve biraz irileşir (hasat ayı). Balkabağına dokununca öbek
  sevinçle hoplar, tok bir ses ve kıvılcımlar çıkar (adım sayılmaz); günün ilk dokunuşu *hasat payı* verir (kalıcı gelirin
  120 sn'si, en az 30 kredi; `harvestDay` alanı). Pay alınmamışken ilk balkabağı göründüğünde oturumda bir kez "Yol kenarları
  hasada hazırlanmış…" bildirimi gelir. Mevsim dışında ve çöl, kanyon, kar gibi tarla dışı bölgelerde balkabağı çıkmaz. Sayfa
  açıkken ay değişirse 5 sn içinde fark edilir. Testi: `tests/harvest.js`.
- **Mektuplar**: Yolda arada bir yolcunun arkasından (soldan) katlanmış bir kâğıt uçak süzülür, ortalarda yumuşak bir takla atıp
  sağdan çıkar (16 sn; kanadında küçük kırmızı bir mühür, gece ve uzayda sıcak bir ışıltı). Dokununca kâğıt açılır ve "eski bir
  gezgin"in mektubu krem renkli bir kâğıtta (köşesinde mum mühür) okunur; mektup yolcuya adıyla seslenir. 12 mektup vardır ve
  sırayla gelir; her biri oyunun bir sırrına ipucu verir (ritim, kelebekler ve harita, dilekler, yağmur, yadigârlar, kervan, eve
  dönüş, rotalar, garaj). Sıradaki mektup ancak eşiğine gelince yola çıkar: ilk sekizi ömür boyu yolla (başta, 400 m, 5 km,
  maraton, 1000 km, 9000 km, dünya turu, 60.000 km: eve dönüşü anlatan mektup dönüş açılmadan önce gelsin diye), son dördü eve
  dönüş sayısıyla (1, 2, 3, 3) açılır (`data.js` → `LETTERS`).
  İlk uçak açılıştan 70–110 sn sonra gelir (turna sürüsü gökyüzündeyken gelmez, uçak varken de sürü gelmez; dar telefonlarda takla
  konum kartının sağında atılır); kaçırılırsa aynı arayla yeniden gelir. Okunan mektuptan sonra sıradaki en erken
  4–7 dakikada gelir (birikmiş mektuplar 2,5–3,5 dakikada bir); o sırada eşiğine gelinmemişse eşiği geçtikten ~1,5 dakika sonra. Yağmurda ve pencere açıkken gelmez; ilk iki uçakta
  "Gökyüzüne bak!" bildirimi gelir. Okunan mektuplar Yol Defteri'nde (ilk mektuptan sonra görünen *Mektuplar* bölümünde) zarf
  olarak durur, dokununca yeniden açılır; gelmemiş olanlar "?" bekler. Mektuplar eve dönüşte kaybolmaz. Son mektup yazarın
  kim olduğunu söyler (imza yolcunun kendi adıyla: "yıllar sonra") ve *Zamansız Gezgin* kıyafetini açar. Ekonomiye etkisi
  yoktur. Sürüm notunda yalnızca ipucu verilir.
- **Eve Dönüş ve Hatıralar**: Yolculuk 100.000 km'yi geçince Güçlendirmeler sekmesinden eve dönebilirsin; bu eşik her eve dönüşte
  3 katına çıkar (300.000 km, 900.000 km…). Hatıraların verdiği hız yolculukları kısaltmasın diye büyüme 3 kat
  seçildi (`tests/sim_trips.js`): ikinci yolculuk birincisinden biraz kısa sürer, sonrakilerin her biri %10–15 uzar ve oyuncu araç zincirinde
  daha ileri gider (1,5 katta yolculuklar 6,8 saatten 1,7 saate iniyordu). Eski kayıtlarda "eve dönüş hazır" durumu yeni eşiğe göre yeniden hesaplanır. Kredi, araçlar,
  yükseltmeler, güçlendirmeler ve bölgeler sıfırlanır. Rozetler, istatistikler ve ayarlar kalır. Yolculuğun uzunluğuna göre
  hatıra kazanırsın (100.000 km'de 10 hatıra; mesafe 8 katına çıkınca hatıralar 2 katına çıkar). Her hatıra sonraki yolculuklarda
  kalıcı olarak +%10 hız verir.
- **Seyahat rotaları**: Her eve dönüş yeni bir rota açar. Rotalar aynı mesafe eşiklerini kullanır, yani tempo değişmez,
  ama bölgeleri farklı sırayla gezer ve her birinin bir ayrıcalığı vardır:
  - **Anadolu Yolu**: ilk yolculuğun rotası, bölgeler tanıdık sırayla.
  - **Kıyı Yolu** (1. eve dönüş): Ege kıyısı ve zeytinliklerle başlar; yağmur ve gökkuşağı iki kat sık.
  - **Kuzey Yolu** (2.): çam ormanı, karlı geçit ve kuzey ışıkları erkenden; dilek fırsatları (kayan yıldızlar ve v1.42'den beri
    karahindiba tohumları) ve takımyıldızlar iki kat sık. Önceden yalnızca kayan yıldızlar hızlandığı için açık temada etkisizdi.
  - **Çiçek Yolu** (3.): lavanta, lale ve kiraz çiçekleri; altın kelebekler daha sık.
  - **İpek Yolu** (4.): buğday ovası, peri bacaları, kanyon ve çöl; kelebek etkileri %50 uzun, anında kredi iki katı.
  - **Kervansaray Yolu** (5.): çöl, kanyon ve peri bacalarıyla başlar; Kervan iki kat sayılır (yakındaki her gezgin +%20 hız).
  - **Pusula Yolu** (6.): kıyıdan kanyona ve çöle; hazine haritasının parçaları iki kat sık düşer.
  - **Yonca Yolu** (7.): lale, çay bahçeleri ve çam ormanıyla başlar; şanslı adımlar iki kat sık.
  - **Fener Yolu** (8.): zeytinlikler ve kıyıyla başlar; duraklar (gerçek dünya mesafeleri) beş kat ödül verir.
  - **Turna Yolu** (9.): sonbahar korusu, buğday ovası ve karlı geçitten geçer; yalnızca bu rotada gökyüzünden ara sıra
    V düzeninde bir turna sürüsü (5–9 kuş) soldan sağa, yolcuyla aynı yöne uçar (ilki 35–65 sn, sonra 110–200 sn arayla;
    pencere açıkken, yağmurda ve uzayda gelmez). Sürü belirirken uzaktan turna sesleri duyulur, ilk üç sürüde "Gökyüzüne bak!"
    bildirimi gelir. Sürüdeki bir turnaya dokununca sürü kanat çırpıp yükselerek solar ve 25 saniye *Turna Rüzgârı* (hız ×3)
    gelir. Yakalanan sürüler Yol Defteri'nde sayılır (ilk sürüden sonra görünür). Rota kartında ödül yazmaz, yalnızca
    "Turna sürüleri gökyüzünde sana eşlik eder." der; sürüm notunda da yalnızca ipucu verilir.
  - **Uçurtma Yolu** (10.): lale bahçeleri, buğday ovası ve kıyıyla başlar; yalnızca bu rotada gökyüzünde ara sıra ipi kopmuş
    bir uçurtma sağdan sola, rüzgârla süzülür (ilki 35–65 sn, sonra 110–200 sn arayla, 18 sn; kopuk ipi altında sallanır;
    iki renkli baklava gövde, fiyonklu dalgalanan kuyruk, gece ortasında küçük bir fener). Yağmurda, uzayda, pencere açıkken
    ve turna sürüsü ya da kâğıt uçak gökteyken gelmez; uçurtma süzülürken kâğıt uçak da gelmez. İlk üç uçurtmada "Bir yerlerde
    biri ipini kaçırmış olmalı… Gökyüzüne bak!" bildirimi gelir. Dokununca uçurtma yolcuya bağlanır ve 30 saniye *Uçurtma
    Neşesi* (kredi ×3) gelir: uçurtma o süre boyunca yolcunun gerisinde ve yukarısında, eline hafifçe sarkan bir iple uçar
    (uçan araçlarda aracın kuyruğunun gerisinde süzülür; telefonda yolcuya daha yakın durur). Etki bitince ipi bırakır, rüzgârla
    geriye ve yukarıya süzülerek solar. Sayfa yeniden açıldığında etki sürüyorsa uçurtma yerinde belirir. Yakalanan uçurtmalar
    Yol Defteri'nde sayılır. Rota kartında ödül yazmaz; sürüm notunda da yalnızca ipucu verilir.
  - **Göç Yolu** (11., v1.49): buğday ovası, lavanta ve kıyıyla başlar; kuşlar (Kuş Defteri) iki kat sık geçer. Yalnızca bu
    rotada arada bir (ilki 45–75 sn, sonra 150–240 sn arayla) altın bir ışıkla seçilen tepeli bir kuş, Hüdhüd (ibibik) yolcuyla
    aynı yöne çırpıp süzülerek uçar; Mantıku't-Tayr'da kuşları Anka'ya götüren rehber kuş. İlk üç Hüdhüd'de "Gökyüzünde tepeli,
    altın ışıklı bir kuş…" bildirimi gelir. Dokununca tepesini yelpaze gibi açar ve 30 saniye *Hüdhüd'ün Rehberliği* (hız ×2,
    kredi ×2) gelir; ilk karşılaşmada Kuş Defteri'ne altın kenarlı gizli bir sayfa eklenir (yedi kuşun sayısını ve Kuş Gözlemcisi
    kıyafetini etkilemez; `data.js` → `RARE_BIRDS`). Rota kartında ödül yazmaz; sürüm notunda yalnızca ipucu verilir.
  Rotalar 12 tanedir; on birinci eve dönüşle sonuncusu açılır. Hangi rotaların duyurulduğu `routeMax` alanında tutulur: sonradan
  eklenen bir rota, bütün rotaları çoktan açmış oyuncuya da bir sonraki dönüşte "Yeni rota açıldı" diye gelir ve seçilir (eski
  kayıtlarda o zamanki 10 rotadan duyurulanlar sayılır). Eve dönüş penceresi açıkken yol akmaya devam eder; çok hatıralı
  yolculuklarda köy birkaç saniyede geçildiği için pencere açık kaldıkça rota köyden çıkılmış olsa da seçilebilir. Açılmamış rotaların adı gizlidir. Rota, köyden (ilk bölgeden) çıkmadan Eve Dönüş kartından ya da dönüş penceresinden
  değiştirilebilir. Bütün rotalar açıldıktan sonra her dönüş sıradaki rotayla başlar. Pasaport o yolculuğun rotasını gösterir.
- **Yol Arkadaşı**: Güçlendirmeler'den alınan yol arkadaşı 10 seviyeye kadar gelişir. İlk seviye kalıcı +%10 kredi verir,
  sonraki her seviye +%5 ekler (10. seviyede +%55). Seviye 2, 4, 7 ve 10'da görünümü değişir: tasma ve künye, boyunluk, sırtta
  heybe, altın süsler ve parıltı. Dört yol arkadaşı var (biri gizli); kartından seçilir:
  - **Karabaş** (çoban köpeği, 1. seviye): yürürken, patende, kaykayda, bisiklette ve at sırtında yanında koşar; arabada,
    karavanda ve trende camdan, balonda sepetin kenarından bakar.
  - **Kanat** (martı, 3. seviye): her araçta yanında süzülür; uçan araçlarda aracın yanında, yerde yolcunun üstünde uçar.
  - **Tekir** (kedi, 5. seviye): Karabaş gibi yanında koşar ve araçlarda camdan bakar.
  - **Kızıl** (tilki, gizli): seviyeyle açılmaz. Yol arkadaşıyla (en az 1. seviye) ormanlık bölgelerde (Çam Ormanı, Sonbahar
    Korusu, Karlı Geçit, Kuzey Işıkları) gezerken arada bir yolcunun önünde, aynı şeritte yabani bir tilki tırısla koşar
    (ilki bölgede 50–90 sn sonra, sonra 140–240 sn arayla; 15 sn kalır; yağmurda, uzayda, sandık varken ve pencere açıkken gelmez).
    Gece önce karanlıkta bir çift göz parlar, gövde sonra belirir; tilki arada başını çevirip yolcuya bakar. İlk tilkide
    "Çalıların arasında bir şey kıpırdadı…" bildirimi gelir. Dokununca sevinçle sıçrar ve çalılara dalar; her karşılaşma bir kez
    sayılır. Üçüncü karşılaşmada (`Econ.foxNeed`, `state.fox`, ömür boyu) güvenir, Kızıl adıyla yol arkadaşı olur ve hemen seçilir.
    Yol Arkadaşı kartında kilitliyken "???" ve "Ormanda biri seni izliyor…" yazar; ilk karşılaşmadan sonra dolan üç pati izi
    görünür. Kızıl'ın görünüm aşamaları: tasma, boyunluk, sırtta minik bir fener (gece yolunu aydınlatır), altın süsler ve parıltı.
    Ekonomiye etkisi yoktur. Sürüm notunda yalnızca ipucu verilir.
  Yol arkadaşı eve dönüşte de yolcuyla kalır.
- **Kartpostal**: HUD'daki fotoğraf makinesi düğmesi o anki manzarayı arayüzsüz, kenarlıklı bir kartpostala çevirir
  (bölge adı, yol, araç, tarih ve pul). Kartpostal indirilebilir; destekleyen cihazlarda doğrudan paylaşılabilir.
  **Kartpostal Albümü (v1.51)**: Çekilen son 12 kartpostalın fotoğrafı (360 px JPEG) ayrı bir anahtarda (`idle-traveler-album`,
  ana kaydı şişirmez; 12 kartpostal ~240 kB) saklanır; yer kalmazsa en eskiler silinir, depolama kapalıysa albüm boş kalır.
  Kartpostal penceresi "Albümüne eklendi · Yol Defteri" der. Yol Defteri'nde ilk kartpostaldan sonra *Kartpostal Albümü* bölümü
  görünür: en yenisi başta, hafifçe eğik duran küçük kartpostallar (dokununca düzelir); dokununca fotoğraf altında bölge adı,
  tarih ve yolla büyük açılır, yeniden indirilebilir. Yolculuğu sıfırlamak albümü de siler. Testi: `tests/album.js`.
  **Özel Anlar (v1.54)**: Kartpostal çekilirken sahnede bir olay varsa o an yakalanır (`game.js` → `MOMENTS`): altın kelebek,
  deftere yazılmamış bir kuş, gökkuşağı (ay gökkuşağı da), kayan yıldız, kâğıt uçak, havadaki bir yunus, yabani tilki ve gece
  Kuzey Işıkları bölgesi. Yakalanan anlar fotoğrafın sağ üst köşesinde küçük altın mühürlerle görünür (albümde de; büyük
  görünümün altında adları yazar); yeni bir an "Özel an yakalandı: … (n/8)" diye bildirilir. İlk kartpostaldan sonra Yol
  Defteri'nde *Özel Anlar* bölümü görünür: bulunanlar adıyla, bulunmayanlar sezdiren bir ipucuyla ("Gökyüzü yedi renge
  boyandığında"). Yalnızca karede gerçekten görünen olay sayılır: ekranın içinde (kelebek, kuş, kâğıt uçak, havadaki yunus),
  solmamış (gökkuşağı ve Kuzey Işıkları çizildikleri yoğunluğa göre), gece tilkinin gövdesi belirmiş. Sekizi de bulununca
  (seti tamamlayan kartpostal dahil) kartpostallar altın çerçeveli olur (köşelerinde küçük yıldızlar). `moments` alanında
  ömür boyu tutulur. Ekonomiye etkisi yoktur. Testi: `tests/moments.js`.
- **Yolcunun kıyafeti**: Rozet kademesi topladıkça yeni renkler açılır: Klasik, Gök Mavisi (3 kademe), Orman (8), Lavanta (15),
  Gün Batımı (25), Gece Yolcusu (40) ve Altın Yolcu (60). *Kâşif* rozetle değil, yadigâr rafı dolunca (15 yadigâr) açılır.
  *Zamansız Gezgin* son mektupla (12 mektup), *Yıldız Haritacısı* gökyüzü haritası dolunca (8 takımyıldız), *Denizci* yedinci
  yunus selamıyla, *Kuş Gözlemcisi* Kuş Defteri dolunca (7 kuş) açılır. Açılmamış kıyafetlerin adı gizlidir. Yol Defteri'nden seçilen kıyafet yolcuya, araçların vurgu renklerine, garaj simgelerine
  ve kartpostallara yansır. Diğer gezginler kilitli bir kıyafeti göremez: sunucuya o an üzerinde olan kıyafet gider.
- **Kademeli rozetler**: 17 rozet ailesi var: adım, ritim, şans, kelebek, gökkuşağı, gece, bölge, toplam yol, garaj, yükseltme,
  eve dönüş, hatıra, kartpostal, kayan yıldız, günlük seri, hazine ve yadigâr (Koleksiyoncu). Her aile sekiz kademeden geçer: Plastik, Ahşap, Metal, Bronz,
  Gümüş, Altın, Platin, Elmas (toplam 136 kademe). Her kademe kalıcı kredi bonusu verir (plastikte +%0,5'ten elmasta +%2'ye; bir ailenin
  tamamı +%10). Rozetler ömür boyu kazanılır ve eve dönüşte kaybolmaz. Yol Defteri her ailenin kademesini, kademe noktalarını
  ve bir sonraki hedefi gösterir. v1.42'de üç ailenin son kademeleri ulaşılabilir eşiklere indi (eve dönüş 16 ve 20, önce 20 ve 30;
  bölge 20, 25, 30, önce 21, 31, 45; yükseltme 250 ve 300, önce 300 ve 500): eve dönüş eşiği her dönüşte 3 katına çıktığı için
  30 dönüş ~24.000 saat, 45 bölge 34 dönüş sürüyordu. Kazanılmış kademeler düşmez. *Gece Kuşu* karanlık gökyüzünde geçen
  süreyi sayar: gece ya da uzayda (v1.42'ye kadar açık temada hiç ilerlemiyordu). Yeni kademe eklemek için `data.js` içindeki `TIERS` listesine bir satır ve her ailenin `at`
  dizisine bir eşik eklemek yeter.
- **Çevrimdışı ilerleme**: Oyun kapalıyken ya da sekme arka plandayken yolcu, otomatik hızın %30'u ile
  (güçlendirmeyle %90'a kadar) en fazla 8 saat (uzatılabilir) yürümeye devam eder. Son görülme zamanını (`lastSeen`) yalnızca
  çalışan döngü ve açılış ilerletir, kayıt ilerletmez: gizli sekmede gelen bir kayıt (ör. yeni sürümle yenilenme) sekmenin gizli
  kaldığı süreyi silmez (v1.44'e kadar her yayın arka plandaki sekmelerin çevrimdışı ilerlemesini o ana kadar siliyordu).
  Tarayıcı depolamaya hiç izin vermiyorsa (site verileri engelli) oyun yeni bir oyuncu gibi tanıtım ve ad penceresiyle açılır,
  "Bu tarayıcı oyunu kaydetmeye izin vermiyor" der, sayfayı yenilemeye çalışmaz (yeni sürüm yoklaması da kendiliğinden yenilemez,
  kaydedilemeyen ilerleme silinmesin), yolculuğu sıfırlamaya izin verir ve oturum boyunca Yolcular'a katılır.
  Tanıtım penceresi kapanmadan (yeni oyuncu) geçen süre çevrimdışı yolculuk sayılmaz; yeni oyuncu ad penceresinden sonra "sen
  yokken…" raporu görmez. Ad penceresindeki kırmızı uyarı geçerli bir ad yazılınca kural metnine döner; basılı tutulan Enter
  boş adı hemen reddetmez.
- **Gündüz ve gece**: Sahne varsayılan olarak tarayıcının temasını izler. Açık tema güneşli gündüzdür, koyu tema fenerlerin yandığı
  yıldızlı gecedir. HUD'daki güneş/ay düğmesiyle ya da Ayarlar > Gökyüzü (Otomatik / Gündüz / Gece) seçimiyle
  tarayıcı temasından bağımsız olarak sabitlenebilir. Değişimde gün batımı ya da gün doğumuyla yumuşak bir geçiş olur.
- **Gün Döngüsü**: Ayarlar > Gökyüzü'ndeki *Gün döngüsü* seçeneğiyle sahne, sayfa temasından bağımsız olarak
  kendi gündüzünü ve gecesini yaşar; arayüz tarayıcı temasında kalır. Bir gün 10 dakika sürer. Gündüz ve gece payı bölgenin
  mevsimine göre değişir: yaz bölgelerinde (Lavanta, Buğday Ovası, Ege Sahili, Kanyon, Çöl, Çay Bahçeleri) geceler kısa,
  kış bölgelerinde (Karlı Geçit, Kuzey Işıkları) uzundur; ilkbahar ve sonbahar arada kalır. Alacakaranlığın hızı da bölgeye
  göre değişir: çölde ve kanyonda güneş hızlı batar, karlı kuzeyde alacakaranlık uzun sürer. Bölge değişince geçiş yumuşaktır.
  Gün döngüsü açıkken başlıktaki tema düğmesi döngüyü kapatmaz; yalnızca sayfanın açık/koyu temasını değiştirir
  (seçim kaydedilir, döngü yeniden seçilince sayfa yine tarayıcı temasını izlemeye başlar).
  Akşam ve sabah olduğunda kısa bir bildirim gelir; Ayarlar penceresi o bölgenin mevsimini ve gündüz/gece sürelerini gösterir.

İlerleme tarayıcının `localStorage` alanına otomatik kaydedilir. Kayıt okunamazsa yeni bir oyunla ezilmez: JSON sağlam ama kod
okuyamıyorsa (ör. yayın sırasında eski ve yeni dosyalar karışırsa) o oturumda kayda hiç yazılmaz, sayfa yenilenince kayıt aynen açılır.
JSON bozuksa ilk bozuk kopya `idle-traveler-save-v1-bak` anahtarına konur (sonraki hatalar onu ezmez) ve orada sağlam bir yedek varsa
oyun ondan sürer. Ana kayıt sağlam açılınca yedek silinir. Kilitli oturumda tanıtım ve ad sorulmaz, Yolcular'a kayıt gönderilmez;
oyuncuya kaydın korunduğu söylenir ve yeni sürüm yayındaysa sayfa kendiliğinden yenilenir. Kilitli oturumda (depolama hiç
okunamadığında da) *Yolculuğu sıfırla* korunan kayda dokunmaz.
**İki sekme**: Oyun iki sekmede açıksa bir sekme kaydı yazınca öteki (`storage` olayıyla) kaydetmeyi ve Yolcular'a haber vermeyi
bırakır; görünürse "Oyun başka bir sekmede de açık" bildirimi gelir. O sekmeye dönülünce sayfa yumuşakça yenilenir ve son kayıtla
sürer. Böylece arka planda bekleyen eski bir sekme, ötekinde yapılan alımları ve ilerlemeyi ezmez.
**Saat oynatma**: `lastSeen` yalnızca ileri gider. Saat geri alınmışsa (kayıt gelecekte) çevrimdışı ilerleme gerçek zaman o ana
yetişince sürer (bozuk bir saat sonsuza kilitlemesin diye en çok 2 gün ileride tutulur); saati ileri alıp geri getirerek aynı
çevrimdışı ilerleme tekrar tekrar alınamaz. Oyun açıkken saat geri alınırsa (duvar saati `performance.now`'dan 2 sn'den fazla geri
kalırsa) etkiler kalan sürelerini korur. Kayan yıldız dileği ile karahindiba dileği aynı anda sürerse kredi ×100 değil ×10 olur
(ikisi aynı dilektir). Çevrimdışı özet, sessizce verilen bölge ve durak ödüllerini de kazanılan krediye katar.
Oyun açıkken 10 saniyeye kadarki aralar (uygulama değiştirme, takılan bir kare) sessizce çevrimdışı hızla sayılır; daha uzun aralarda
hız ortalamaları sıfırlanır, böylece dönüşte verilen bölge, durak ve günlük ödülleri sekme gizlenmeden önceki tıklama hızıyla değil
otomatik gelirle ölçülür (sayfayı kapatıp açmakla aynı).

## Diller ve ülkeler

Oyun Türkçe, İngilizce, Almanca, İspanyolca ve Fransızca oynanabilir. Dil tarayıcıdan otomatik seçilir;
tanıtım penceresinden ya da başlık çubuğundaki Ayarlar'dan değiştirilebilir.

- **Sayılar** her dilin kendi biçimiyle gösterilir: `3,24 Mn`, `3.24 M`, `3,24 Mio.`; yüzdeler `%25`, `25%`, `25 %`.
- **Birimler**: ABD ve Birleşik Krallık'ta mesafe mil, hız mph ile; diğer ülkelerde km ve km/sa (km/h) ile gösterilir.
  Ayarlardan elle seçilebilir.
- **Büyük birimler**: Mesafe 0,5 AB'yi geçince AB (astronomi birimi: Dünya ile Güneş arası, ≈149,6 milyon km), 0,1 ışık yılını
  geçince ışık yılı ile yazılır. İlk geçişte birimi anlatan bir bildirim gelir (AB ve ışık yılı için birer kez; eve dönüşte
  tekrarlamaz). Bu birimler gösterilirken sahnedeki mesafenin yanında küçük bir "i" belirir: dokununca (ya da üstüne gelince)
  açıklama yeniden görünür, dokunuş adım sayılmaz. Yol Defteri'ndeki mesafelerde de üstüne gelince açıklama vardır. Açıklamadaki
  sayılar oyuncunun birim sistemiyle yazılır (≈149,6 Mn km ya da ≈93 M mil).
- **Gerçek dünya durakları** ülkeye göre yerelleşir: Türkçede "İstanbul – Ankara", Fransızcada "Paris – Lyon",
  Almancada "Berlin – Frankfurt" gibi benzer uzunlukta rotalar.

**Yeni dil eklemek:** `public/js/lang/en.js` dosyasını `public/js/lang/<kod>.js` olarak kopyala, `IT.addLang('<kod>', …)`
içindeki adı, `locale`, `suffixes` ve `units` alanlarını ve bütün metinleri çevir. `{ad}` yer tutucularını olduğu gibi bırak;
`{ one, other }` nesneleri çoğul biçimlerdir. Sonra dosyayı `public/index.html` içinde diğer dil dosyalarının yanına ekle.
Eksik bir anahtar önce İngilizceye, sonra Türkçeye düşer.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `public/index.html` | Sayfa iskeleti, HUD ve panel |
| `public/css/style.css` | Arayüz stilleri, açık/koyu tema token'ları |
| `public/js/i18n.js` | Yerelleştirme çekirdeği: dil seçimi, çeviri (`IT.t`), çoğul biçimler, birim sistemi |
| `public/js/lang/*.js` | Dil sözlükleri: `tr`, `en`, `de`, `es`, `fr` |
| `public/js/changelog.js` | Sürüm numarası (`IT.VERSION`) ve beş dilde sürüm notları (`IT.CHANGELOG`) |
| `public/js/data.js` | Araçlar, güçlendirmeler, rozetler, kıyafetler, biyomlar, bölgeler, duraklar, ekonomi ve hatıra formülleri, sayı biçimleri |
| `public/js/scene.js` | Canvas sahnesi: paralaks katmanlar, gün/gece, biyom geçişleri, yağmur ve gökkuşağı, araç çizimleri, parçacıklar, diğer gezginler |
| `public/js/audio.js` | Web Audio ile üretilen sesler (dosya yok): adım, satın alma, rüzgâr, yağmur, rüzgâr çanları. Sekme gizlenince susar |
| `public/js/online.js` | Yolcular: gezgin kimliği, ad kuralı, sunucuyla 30 saniyede bir haberleşme (`IT.Online`) |
| `public/js/game.js` | Oyun durumu, döngü, kayıt, çevrimdışı ilerleme, hava olayları, rozetler, eve dönüş, gökyüzü ayarı, ad penceresi, arayüz |
| `src/worker.js` | Cloudflare Worker: statik siteyi sunar, `/api/hello` ve `/api/players` uçlarıyla Yolcular listesini D1'de tutar |
| `migrations/` | D1 veritabanı şeması (`players` tablosu) |
| `wrangler.jsonc` | Cloudflare Workers ayarı: Worker kodu, statik varlık klasörü, D1 bağlantısı ve özel alan adı |
| `tests/` | Playwright testleri, regresyon ve çok oyunculu test çalıştırıcıları, ekonomi simülasyonları |

Tüm görseller kodla çizilir. Harici görsel ya da ses dosyası yoktur.

## Sürüm yayınlamak

Her yayında `public/js/changelog.js` içindeki `IT.VERSION` değerini artır ve `IT.CHANGELOG` dizisinin başına yeni sürümün
notlarını beş dilde (tr, en, de, es, fr) ekle. Oyuncular bir sonraki açılışta Yenilikler düğmesinde noktayı görür.
