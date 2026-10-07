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
  oyuncunun ulaşabileceği yolun 100 katını aşamaz; aşan değer reddedilmez, sınıra kırpılır. Sınır isteklerin sıklığıyla değil kaydın
  yaşıyla büyür (yeni kayıt en çok ~770.000 km, 1 saatlik kayıt ~10¹⁵ m, 1 günlük ~5×10¹⁷ m), böylece kısa aralıklı isteklerle
  tavan aşılamaz. Eğri `tests/sim_game.js '{"profile":"lucky","reach":1,"cps":5,"night":1,"hours":48}'` ile ölçüldü
  (Worker'daki `REACH`). v1.38'de simülasyon Kelebek Dostu'nu da almaya başlayınca eğrinin önceki ölçümden çok daha yüksek
  olduğu görüldü (v1.37 öncesi kurallarla 1. saatte ~2000 katı); tablo, bugünkü ve v1.37 öncesi kuralların büyüğüne göre
  yenilendi, böylece o kurallarla ilerlemiş dürüst kayıtlar da kırpılmaz. Canlıda kırpılmış bir kayıt görülmedi. Oyun tarayıcıda çalıştığı için sahtecilik
  tamamen önlenemez, ama tek istekle listenin zirvesine çıkılamaz.
- Aynı kaydı en sık 5 saniyede bir yazar. 30 gün görünmeyen ve toplamda 1 km'ye ulaşmamış kayıtlar ara sıra silinir; yol gitmiş
  gezginler tüm zamanlar listesi için kalır.
- Ad sunucuda da aynı kuralla temizlenir ve denetlenir.

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
- **Yenilikler**: Sürüm düğmesi her sürümde neyin değiştiğini tarihleriyle gösterir. Oyuncunun henüz görmediği bir sürüm
  yayınlandığında düğmede turuncu bir nokta belirir ve kısa bir bildirim gelir; pencerede yeni sürümler işaretlidir.
  Yeni oyuncular eski sürüm notlarını "yeni" olarak görmez.
  Yenilikler, Ayarlar ve Kartpostal pencereleri dışına basınca ya da Esc tuşuyla kapanır (tanıtım penceresi düğmeyle kapanır).
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
- **Adım at**: Sahneye dokun ya da Boşluk tuşuna bas. Hızlı ve ritmik tıklamalar *Ritim* bonusunu doldurur (telefonda da
  sahnenin altında küçük bir kutuda görünür). Art arda atılan adımların mesafesi tek bir büyüyen yazıda toplanır.
- **Araçlar**: Yürüyüş → Paten → Kaykay → Bisiklet → At → Motosiklet → Araba → Karavan → Tren →
  Sıcak Hava Balonu → Uçak → Süpersonik Jet → Roket → Güneş Yelkeni → Kuyruklu Yıldız → Yıldız Gemisi (16 araç).
  Son ikisi v1.36'da zincirin sonuna eklendi (hız ×2,5, fiyat ~×10,7 ve ×11); erken ve orta oyunun dengesi değişmedi.
  Uzun yolculuklarda (eve dönüş eşiği her dönüşte 3 katına çıktığı için) yeni hedef olurlar. *Garaj Sahibi* rozetinin
  son iki kademesi 14 ve 16 araç oldu (önce 13 ve 14; kazanılmış kademeler düşmez).
  Her aracın kendi yükseltme hattı var. Her seviye +%10 hız verir; Sv. 25, 50, 100, 150 ve 200'de hız ikiye katlanır
  (en büyük sıçrama Sv. 50'de). Yükseltme satırı sıradaki eşiği söyler: yeni görünüm (Sv. 10) ya da hız ×2.
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
  Tek yolculukta araçlara ulaşma, ortanca (8 deneme; parantezde en hızlı–en yavaş), v1.38:
  - **Şanslı + aktif** (2,5 dokunuş/sn ritimle, her olayı yakalar, her zar iki denemenin iyisi), gün döngüsünde (%44 gece):
    tren ~8 dk, uçak ~15 dk, jet ~30 dk, roket ~74 dk (66–80), Güneş Yelkeni ~3 saat (156–180 dk), Kuyruklu Yıldız ~8,3 saat.
    Hep gece (koyu tema): Güneş Yelkeni ~171 dk; hep gündüz (açık tema): ~184 dk. Yıldız Gemisi 24 saatte ulaşılamaz;
    hatıralarla hızlanan sonraki yolculukların hedefidir (`sim_trips.js 14 0.5`: olaysız oyuncu Kuyruklu Yıldız'a 14. yolculukta ulaşır).
  - **Aktif** (aynı, normal şans): tren ~10 dk, uçak ~25 dk, roket ~94 dk, Güneş Yelkeni ~3,6 saat, Kuyruklu Yıldız ~8,2 saat.
  - **Sıradan** (0,3 dokunuş/sn, olayların yarısını yakalar): motor ~18 dk, tren ~44 dk, uçak ~2,1 saat, jet ~4,6 saat, roket ~10 saat.
  Karşılaştırma (aynı simülasyonla): v1.36 kurallarında Güneş Yelkeni şanslı oyuncuda ~37 dk, aktifte ~93 dk; sıradan oyuncuda
  roket ~10 saat. v1.37 (kalıcı gelirle ödüller) aktif oyuncuları yavaşlattı, sıradan oyuncuyu neredeyse değiştirmedi.
- **Gelire bağlı ödüller (v1.37)**: Bölge (40 sn), durak (30 sn), kelebekten anında kredi (600 sn), hazine sandığı (6000 sn)
  ve günün hediyesi (120 sn × gün) **kalıcı gelirin** o kadar saniyesini verir (`game.js` → `REWARD`, `sim_game.js` → `RW`).
  Kalıcı gelir, geçici çarpanlar (kelebek etkileri, gökkuşağı, dilek, kervan) olmadan hesaplanan kredi/sn'dir (`baseEma`).
  Önceden ödüller şişmiş gelirle hesaplanıyordu: dilekle (kredi ×10) düşen dördüncü harita parçasının sandığı on kat,
  gökkuşağı ile Rüzgâr Hortumu'nun (×30 hız) üst üste geldiği anlardaki bölge ödülleri otuz kat veriyordu. Tempo bu rastlantıya
  bağlıydı (sıradan oyuncu trene 4 ile 72 dk arasında ulaşıyordu). Süreler `sim_game.js` ızgarasıyla seçildi; şansa bağlı
  yayılım daraldı. (Izgara o sırada Kelebek Dostu'nu almayan simülasyonla yapıldı; düzeltilmiş ölçüm için yukarıdaki Tempo'ya bak.)
  Olaylar yine güçlüdür: hazine sandığı aktif oyuncunun en büyük gelir kaynağıdır (saatte ~12 sandık).
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
- **Canlı mesafeler**: Her oyuncu bildirimde hızını da (`spd`, m/sn) gönderir. İki bildirim arasında diğer gezginlerin
  mesafesi bu hızla tahmin edilir (en çok 3 dakika), böylece sahnedeki etiketler ve Yolcular listesi canlı akar; liste
  açıkken iki saniyede bir tazelenir ve sıra tahmini mesafeye göre yeniden kurulur.
- **Hazır mesajlar**: Sahnenin sağ altındaki konuşma düğmesi 9 hazır mesaj açar (👋 Merhaba!, 🌄 Ne güzel manzara!, 🚀 Haydi,
  yola devam!, ✋ Bekle beni!, 🏁 Yarışalım mı?, ⭐ Harika gidiyorsun!, 💛 Teşekkürler!, ☕ Mola zamanı., 🌙 İyi yolculuklar!).
  Seçilen mesaj yolcunun başının üstünde 8 saniyelik bir konuşma balonu olur; diğer oyuncuların sahnesinde de o gezginin
  başında görünür (kısa bir ses ve küçük bir sıçrayışla). Sunucu yalnızca mesajın kimliğini saklar, her oyuncu metni kendi
  dilinde görür; serbest metin yoktur. Mesajlar arasında 5 saniye bekleme vardır (düğmenin çevresinde azalan bir halka).
  Yatay telefonlarda (alçak sahne) mesaj seçici beş sütunlu iki sıraya geçer, böylece taşmaz.
  Az önce konuşan gezgin sahnede öncelikle gösterilir; Yolcular listesinde son bir dakikanın mesajı adının altında yazar.
  Yolda başka gezgin varken ve sekme açıkken mesajlar 6 saniyede bir yoklanır; yalnızken hiç istek atılmaz.
- **Araç görünümleri**: Yükseltmeler aracı görünür biçimde geliştirir. Seviye 10, 25, 50, 100, 150 ve 200'de her araç yeni
  bir görünüm kazanır (25'ten sonrakiler aynı zamanda hızın ikiye katlandığı eşikler); 100. seviyede altın süsler ve parıltı gelir.
  150. seviyede aracın arkasından kıyafet renklerinde yıldız tozu izi akar, 200. seviyede buna dalgalanan bir gökkuşağı kuyruğu
  eklenir (trende iz lokomotifin bacasından çıkıp vagonların üstünden akar). Garaj simgelerinde bu aşamalar köşelerdeki altın
  yıldızlar ve aracın arkasındaki minik gökkuşağı yayıyla görünür; diğer gezginler ve Yolcular listesindeki simgeler de bu
  görünümle çizilir. Örnekler: yürüyüşte sopa, atkı ve
  şapka tüyü; patende dizlik; kaykayda boyalı tahta ve ışıklı tekerlek; bisiklette flama, altın jant ve heybe; atta saçaklı
  eyer örtüsü, yeleye örülü kurdele ve heybe; motosiklette rüzgâr camı, şerit ve çanta kutusu; arabada yarış şeridi, altın jant
  ve sörf tahtası; karavanda çiçek desenleri, arkada bisiklet, güneş paneli ve ışık zinciri; trende bayrak, altın şerit ve
  dördüncü vagon; balonda flamalar, renkli zarf ve kum torbaları; uçakta kuyruk şeridi, kanatçık ve pankart; jette burun ucu,
  kanat şeridi ve art yakıcı; rokette şeritler, yan iticiler ve anten; güneş yelkeninde yıldız arması, yanardöner kenar ve
  ikinci yelken; kuyruklu yıldızda (yolcu buzlu kaya çekirdeğin sırtında oturup dizgin tutar) eyer örtüsü ve dizgin, buz
  kristalleri ve ikinci (toz) kuyruk; yıldız gemisinde (üstte ve altta pilonlu motor bölmeleri, kubbe kokpit, bir bükülme
  halkası) gövde şeridi ve lomboz ışıkları, ikinci ve üçüncü bükülme halkası ve konum ışıkları. Garaj simgeleri aracın o anki görünümünü gösterir; yükseltme satırı yeni görünümün geleceği seviyeyi söyler.
  At dörtnal (kanter) koşar: her bacak yere basar (toynak yerde kalır) ve havada katlanıp öne gelir; ön dizler öne, arka diz
  eklemleri geriye bükülür. Gövde adım başına bir kez yükselir, baş ve boyun adımla sallanır, yele telleri ve kuyruk rüzgârda
  dalgalanır, kulak ara sıra seğirir. Binici atı biraz gecikmeyle izler, dizgin başa uzanır; toynaklar yere vurdukça toz kalkar.
  Bisiklette pedallar krank kollarıyla aynakol dişlisine bağlı döner (dişliden arka göbeğe zincir uzanır), ayaklar pedallara basar;
  binicinin omuzları ve başı her pedal vuruşunda hafifçe iner ve yana salınır, sepetteki çiçekler sallanır.
  Uçan araçlar yolun üstünde gökyüzünde süzülür, yol ve manzara görünmeye devam eder. Roket ve güneş yelkeninde gökyüzü koyulaşır, yıldızlar belirir.
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
  Tavanlı olanlar v1.38'de dikleşti (büyüme: Ritim ×4, Şans ve Rüya ×4,5, Kamp ×2,3, Kelebek Dostu ×5, Yol Arkadaşı ×6). Son
  seviyeleri artık minibüs ile uçak arasındaki fiyatlarda (Ritim ~79 Mn, Kelebek Dostu ~3,5 Mr, Yol Arkadaşı ~50 Mr); önceden
  hepsi ~3 Mr tutuyordu ve aktif oyuncu ilk 10 dakikada bitiriyordu. Sıradan oyuncu onları ilk ~3 saate yayar, tempo neredeyse aynı kaldı.
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
  yumuşakça nabız atar. Bir kelebek etkisinin 5 dakikadan fazla süresi kalmışken aynı kelebek yeniden yakalanırsa süre değil
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
- **Hazine haritası**: Yakalanan her altın kelebek %20, her dilek (kayan yıldız ya da karahindiba) %50 olasılıkla bir harita parçası düşürür. Dört parça
  tamamlanınca yolcunun önünde, yol kenarında parlayan bir hazine sandığı belirir (25 saniye kalır; kaçırılırsa 45 saniye sonra
  yeniden gelir). Sandık yaklaşık 100 dakikalık kalıcı gelir kadar kredi verir (İpek Yolu'nda iki katı), harita sıfırlanır. Yol Defteri
  açılan parçaları ve bulunan hazine sayısını gösterir; *Hazine Avcısı* rozet ailesi bulunan sandıkları sayar.
- **Bahar yağmuru**: Yeşil bölgelerde ara sıra yağmur yağar. Gündüz yağmurun ardından gökkuşağı çıkar ve 20 saniye boyunca hız ×10 olur.
- **Yadigârlar**: Her bölgenin (biyomun) bir yadigârı var: köy balı, lavanta demeti, çam fidanı, başak demeti, deniz kabuğu,
  eski testi, kiraz çiçeği, kızıl yaprak, kum saati, kardan adam, yıldız dürbünü, çay fincanı, minik balon, lale ve nazar boncuğu.
  Yadigârı henüz bulunmamış bir bölgede yaklaşık 45–85 saniye sonra aracın önünde, yolun biraz üstünde parıldayan bir cam kabarcık
  belirir ("Yol kenarında bir şey parıldıyor…"). 20 saniye süzülür; kaçırılırsa 1,5–2,5 dakika sonra yeniden gelir. Dokununca
  yadigâr rafa konur ve ömür boyu +%2 hız verir (15 yadigârla +%30). Eve dönüşte kaybolmaz. Yol Defteri'ndeki rafta bulunanlar
  bölgenin renginde durur (dokununca küçük bir sallanma ve ses), bulunmayanlar "?" ve bölgenin adıyla bekler. Bazı bölgelere ilk
  yolculukta varılamaz; onları başka rotalar erken gezer. *Koleksiyoncu* rozet ailesi bulunan yadigârları sayar, raf dolunca
  *Kâşif* kıyafeti açılır. Sürüm notunda yalnızca ipucu verilir.
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
  - **Kuzey Yolu** (2.): çam ormanı, karlı geçit ve kuzey ışıkları erkenden; kayan yıldızlar iki kat sık.
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
  Rotalar 10 tanedir; dokuzuncu eve dönüşle sonuncusu açılır. Açılmamış rotaların adı gizlidir. Rota, köyden (ilk bölgeden) çıkmadan Eve Dönüş kartından ya da dönüş penceresinden
  değiştirilebilir. Bütün rotalar açıldıktan sonra her dönüş sıradaki rotayla başlar. Pasaport o yolculuğun rotasını gösterir.
- **Yol Arkadaşı**: Güçlendirmeler'den alınan yol arkadaşı 10 seviyeye kadar gelişir. İlk seviye kalıcı +%10 kredi verir,
  sonraki her seviye +%5 ekler (10. seviyede +%55). Seviye 2, 4, 7 ve 10'da görünümü değişir: tasma ve künye, boyunluk, sırtta
  heybe, altın süsler ve parıltı. Üç yol arkadaşı var; kartından seçilir:
  - **Karabaş** (çoban köpeği, 1. seviye): yürürken, patende, kaykayda, bisiklette ve at sırtında yanında koşar; arabada,
    karavanda ve trende camdan, balonda sepetin kenarından bakar.
  - **Kanat** (martı, 3. seviye): her araçta yanında süzülür; uçan araçlarda aracın yanında, yerde yolcunun üstünde uçar.
  - **Tekir** (kedi, 5. seviye): Karabaş gibi yanında koşar ve araçlarda camdan bakar.
  Yol arkadaşı eve dönüşte de yolcuyla kalır.
- **Kartpostal**: HUD'daki fotoğraf makinesi düğmesi o anki manzarayı arayüzsüz, kenarlıklı bir kartpostala çevirir
  (bölge adı, yol, araç, tarih ve pul). Kartpostal indirilebilir; destekleyen cihazlarda doğrudan paylaşılabilir.
- **Yolcunun kıyafeti**: Rozet kademesi topladıkça yeni renkler açılır: Klasik, Gök Mavisi (3 kademe), Orman (8), Lavanta (15),
  Gün Batımı (25), Gece Yolcusu (40) ve Altın Yolcu (60). *Kâşif* rozetle değil, yadigâr rafı dolunca (15 yadigâr) açılır.
  Açılmamış kıyafetlerin adı gizlidir. Yol Defteri'nden seçilen kıyafet yolcuya, araçların vurgu renklerine, garaj simgelerine
  ve kartpostallara yansır. Diğer gezginler kilitli bir kıyafeti göremez: sunucuya o an üzerinde olan kıyafet gider.
- **Kademeli rozetler**: 17 rozet ailesi var: adım, ritim, şans, kelebek, gökkuşağı, gece, bölge, toplam yol, garaj, yükseltme,
  eve dönüş, hatıra, kartpostal, kayan yıldız, günlük seri, hazine ve yadigâr (Koleksiyoncu). Her aile sekiz kademeden geçer: Plastik, Ahşap, Metal, Bronz,
  Gümüş, Altın, Platin, Elmas (toplam 136 kademe). Her kademe kalıcı kredi bonusu verir (plastikte +%0,5'ten elmasta +%2'ye; bir ailenin
  tamamı +%10). Rozetler ömür boyu kazanılır ve eve dönüşte kaybolmaz. Yol Defteri her ailenin kademesini, kademe noktalarını
  ve bir sonraki hedefi gösterir. Yeni kademe eklemek için `data.js` içindeki `TIERS` listesine bir satır ve her ailenin `at`
  dizisine bir eşik eklemek yeter.
- **Çevrimdışı ilerleme**: Oyun kapalıyken ya da sekme arka plandayken yolcu, otomatik hızın %30'u ile
  (güçlendirmeyle %90'a kadar) en fazla 8 saat (uzatılabilir) yürümeye devam eder.
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

İlerleme tarayıcının `localStorage` alanına otomatik kaydedilir.

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
