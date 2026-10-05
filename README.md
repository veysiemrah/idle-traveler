# Idle Traveler

Manzaralı bir yolda geçen, tarayıcıda çalışan rahatlatıcı bir idle (rölanti) oyunu.
Sırt çantalı bir yolcu yürüyerek başlar. Her tıklama bir adımdır, kat edilen her metre kredi kazandırır.
Kredilerle yeni araçlar, araç yükseltmeleri ve kalıcı güçlendirmeler alınır.

## Oynamak

Derleme adımı yok. Site dosyaları `public/` klasöründe; `public/index.html` dosyasını tarayıcıda açman yeterli.
İstersen basit bir sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000 -d public
# http://localhost:8000
```

## Yayın: Cloudflare Workers → idle-traveler.vebaban.com

Site Cloudflare'de, statik varlık sunan bir Worker olarak barınır (`wrangler.jsonc`).
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

## Oyun

- **Başlık çubuğu**: Sayfanın üstünde oyunun adı, sürüm numarası ve *Yenilikler* düğmesi ile ayarlar (dişli), kartpostal,
  tema (gündüz/gece) ve ses düğmeleri durur. Ayarlar penceresinde dil, birimler, ses efektleri, ortam sesi, gökyüzü ve
  yolculuğu sıfırlama bulunur. Dar telefonlarda yalnızca logo, sürüm ve düğmeler kalır.
- **Yenilikler**: Sürüm düğmesi her sürümde neyin değiştiğini tarihleriyle gösterir. Oyuncunun henüz görmediği bir sürüm
  yayınlandığında düğmede turuncu bir nokta belirir ve kısa bir bildirim gelir; pencerede yeni sürümler işaretlidir.
  Yeni oyuncular eski sürüm notlarını "yeni" olarak görmez.
  Yenilikler, Ayarlar ve Kartpostal pencereleri dışına basınca ya da Esc tuşuyla kapanır (tanıtım penceresi düğmeyle kapanır).

- **Adım at**: Sahneye dokun ya da Boşluk tuşuna bas. Hızlı ve ritmik tıklamalar *Ritim* bonusunu doldurur (telefonda da
  sahnenin altında küçük bir kutuda görünür). Art arda atılan adımların mesafesi tek bir büyüyen yazıda toplanır.
- **Araçlar**: Yürüyüş → Paten → Kaykay → Bisiklet → At → Motosiklet → Araba → Karavan → Tren →
  Sıcak Hava Balonu → Uçak → Süpersonik Jet → Roket → Güneş Yelkeni (14 araç).
  Her aracın kendi yükseltme hattı var. Her seviye +%25 hız verir, 10, 25, 50… seviyelerde hız ikiye katlanır.
- **Araç görünümleri**: Yükseltmeler aracı görünür biçimde geliştirir. Seviye 10, 25, 50 ve 100'de (hızın ikiye katlandığı
  eşikler) her araç yeni bir parça kazanır; 100. seviyede altın süsler ve parıltı gelir. Örnekler: yürüyüşte sopa, atkı ve
  şapka tüyü; patende dizlik; kaykayda boyalı tahta ve ışıklı tekerlek; bisiklette flama, altın jant ve heybe; atta saçaklı
  eyer örtüsü, yeleye örülü kurdele ve heybe; motosiklette rüzgâr camı, şerit ve çanta kutusu; arabada yarış şeridi, altın jant
  ve sörf tahtası; karavanda çiçek desenleri, arkada bisiklet, güneş paneli ve ışık zinciri; trende bayrak, altın şerit ve
  dördüncü vagon; balonda flamalar, renkli zarf ve kum torbaları; uçakta kuyruk şeridi, kanatçık ve pankart; jette burun ucu,
  kanat şeridi ve art yakıcı; rokette şeritler, yan iticiler ve anten; güneş yelkeninde yıldız arması, yanardöner kenar ve
  ikinci yelken. Garaj simgeleri aracın o anki görünümünü gösterir; yükseltme satırı yeni görünümün geleceği seviyeyi söyler.
  Uçan araçlar yolun üstünde gökyüzünde süzülür, yol ve manzara görünmeye devam eder. Roket ve güneş yelkeninde gökyüzü koyulaşır, yıldızlar belirir.
- **Yol tecrübesi**: Hızını garajdaki en güçlü araç belirler, diğer araçlar hızlarının yarısını katar. Yeni araca her zaman
  hemen binilir. Hangi araca bindiğin yalnızca görünümü değiştirir; hız asla düşmez, eski yükseltmeler boşa gitmez.
  Garajın üstündeki iki özet kutusu en güçlü aracı ve diğer araçlardan gelen hızı canlı gösterir.
- **Sabit düğmeler**: Fiyatlar, seviyeler ya da en güçlü araç değiştikçe garaj ve güçlendirme kartlarındaki düğmeler yerinden
  kaymaz. Düğmeler sabit genişliktedir, değişen değerler kendi satırında durur. Böylece aynı düğmeye art arda basılabilir.
  Araç kartında yükseltme satırı simgenin altında kartın tam genişliğini kullanır; 320 piksellik telefonlarda da sığar.
- **Toplu yükseltme**: Garajın üstündeki ×1 / ×10 / Maks seçimiyle tek dokunuşta birden çok seviye alınır.
- **Güçlendirmeler**: Güçlü Adımlar, Arkadan Esen Rüzgâr, Kartpostal Koleksiyonu (kredi), Yolun Ritmi,
  Şanslı Adım (seviye başına %1 ihtimalle 5 kat uzun adım), Rüyada Yolculuk (çevrimdışı hız), Uzun Mola (çevrimdışı süre), Kelebek Dostu.
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
- **Günün hediyesi**: Her yeni günün ilk ziyaretinde kredi hediyesi gelir (yaklaşık 2 dakikalık gelir). Üst üste gelinen her gün
  hediyeyi büyütür, 7. günde en yüksek düzeye ulaşır. Bir gün atlanırsa seri yeniden başlar. Oyun açıkken gece yarısı geçerse
  hediye hemen gelir. Saat geri alınarak hediye alınamaz. Seri ve en iyi seri Yol Defteri'nde görünür.
- **Hazine haritası**: Yakalanan her altın kelebek %20, her kayan yıldız %50 olasılıkla bir harita parçası düşürür. Dört parça
  tamamlanınca yolcunun önünde, yol kenarında parlayan bir hazine sandığı belirir (25 saniye kalır; kaçırılırsa 45 saniye sonra
  yeniden gelir). Sandık yaklaşık 10 dakikalık gelir kadar kredi verir (İpek Yolu'nda iki katı), harita sıfırlanır. Yol Defteri
  açılan parçaları ve bulunan hazine sayısını gösterir; *Hazine Avcısı* rozet ailesi bulunan sandıkları sayar.
- **Bahar yağmuru**: Yeşil bölgelerde ara sıra yağmur yağar. Gündüz yağmurun ardından gökkuşağı çıkar ve 20 saniye boyunca hız ×10 olur.
- **Eve Dönüş ve Hatıralar**: Yolculuk 50.000 km'yi geçince Güçlendirmeler sekmesinden eve dönebilirsin. Kredi, araçlar,
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
  Açılmamış rotaların adı gizlidir. Rota, köyden (ilk bölgeden) çıkmadan Eve Dönüş kartından ya da dönüş penceresinden
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
  Gün Batımı (25), Gece Yolcusu (40) ve Altın Yolcu (60). Açılmamış kıyafetlerin adı gizlidir. Yol Defteri'nden seçilen kıyafet
  yolcuya, araçların vurgu renklerine, garaj simgelerine ve kartpostallara yansır.
- **Kademeli rozetler**: 16 rozet ailesi var: adım, ritim, şans, kelebek, gökkuşağı, gece, bölge, toplam yol, garaj, yükseltme,
  eve dönüş, hatıra, kartpostal, kayan yıldız, günlük seri ve hazine. Her aile sekiz kademeden geçer: Plastik, Ahşap, Metal, Bronz,
  Gümüş, Altın, Platin, Elmas (toplam 128 kademe). Her kademe kalıcı kredi bonusu verir (plastikte +%0,5'ten elmasta +%2'ye; bir ailenin
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
| `public/js/scene.js` | Canvas sahnesi: paralaks katmanlar, gün/gece, biyom geçişleri, yağmur ve gökkuşağı, araç çizimleri, parçacıklar |
| `public/js/audio.js` | Web Audio ile üretilen sesler (dosya yok): adım, satın alma, rüzgâr, yağmur, rüzgâr çanları. Sekme gizlenince susar |
| `public/js/game.js` | Oyun durumu, döngü, kayıt, çevrimdışı ilerleme, hava olayları, rozetler, eve dönüş, gökyüzü ayarı, arayüz |
| `wrangler.jsonc` | Cloudflare Workers ayarı: statik varlık klasörü ve özel alan adı |

Tüm görseller kodla çizilir. Harici görsel ya da ses dosyası yoktur.

## Sürüm yayınlamak

Her yayında `public/js/changelog.js` içindeki `IT.VERSION` değerini artır ve `IT.CHANGELOG` dizisinin başına yeni sürümün
notlarını beş dilde (tr, en, de, es, fr) ekle. Oyuncular bir sonraki açılışta Yenilikler düğmesinde noktayı görür.
