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

- **Adım at**: Sahneye dokun ya da Boşluk tuşuna bas. Hızlı ve ritmik tıklamalar *Ritim* bonusunu doldurur.
- **Araçlar**: Yürüyüş → Paten → Kaykay → Bisiklet → At → Motosiklet → Araba → Karavan → Tren →
  Sıcak Hava Balonu → Uçak → Süpersonik Jet → Roket → Güneş Yelkeni (14 araç).
  Her aracın kendi yükseltme hattı var. Her seviye +%25 hız verir, 10, 25, 50… seviyelerde hız ikiye katlanır.
  Uçan araçlar yolun üstünde gökyüzünde süzülür, yol ve manzara görünmeye devam eder. Roket ve güneş yelkeninde gökyüzü koyulaşır, yıldızlar belirir.
- **Yol tecrübesi**: Hızını garajdaki en güçlü araç belirler, diğer araçlar hızlarının yarısını katar. Yeni araca her zaman
  hemen binilir. Hangi araca bindiğin yalnızca görünümü değiştirir; hız asla düşmez, eski yükseltmeler boşa gitmez.
  Garajın üstündeki iki özet kutusu en güçlü aracı ve diğer araçlardan gelen hızı canlı gösterir.
- **Sabit düğmeler**: Fiyatlar, seviyeler ya da en güçlü araç değiştikçe garaj ve güçlendirme kartlarındaki düğmeler yerinden
  kaymaz. Düğmeler sabit genişliktedir, değişen değerler kendi satırında durur. Böylece aynı düğmeye art arda basılabilir.
- **Toplu yükseltme**: Garajın üstündeki ×1 / ×10 / Maks seçimiyle tek dokunuşta birden çok seviye alınır.
- **Güçlendirmeler**: Güçlü Adımlar, Arkadan Esen Rüzgâr, Kartpostal Koleksiyonu (kredi), Yolun Ritmi,
  Şanslı Adım (seviye başına %1 ihtimalle 5 kat uzun adım), Rüyada Yolculuk (çevrimdışı hız), Uzun Mola (çevrimdışı süre), Kelebek Dostu.
- **Bölgeler**: Sabah Köyü, Lavanta Tarlaları, Çam Ormanı, Altın Buğday Ovası, Ege Sahil Yolu, Kızıl Kanyon,
  Kiraz Çiçeği Vadisi, Sonbahar Korusu, Vaha Yolu, Karlı Geçit, Kuzey Işıkları, Rize Çay Bahçeleri, Peri Bacaları,
  Lale Bahçeleri (yel değirmenleri), Zeytin Bahçeleri (deniz kıyısında zeytinlikler)… Liste bitince bölgeler ikinci tura girer;
  her yeni bölge öncekinden 3 kat uzaktadır. Her yeni bölge pasaporta bir damga ekler ve kalıcı olarak +%6 hız verir.
- **Duraklar**: Maraton, İstanbul – Ankara, Dünya turu, Ay'a varış, Proxima Centauri… gibi gerçek mesafeler.
- **Altın kelebek**: Arada bir gökyüzünden geçer. Yakalarsan hız ×3, kredi ×2, tıklama ×5 ya da anında kredi verir.
- **Kayan yıldız**: Gece gökyüzünde (ya da uzayda) ara sıra bir yıldız kayar. Dokunup dilek tutarsan 60 saniye boyunca
  *Yıldız Tozu* etkisiyle hız ×2, kredi ×1,5 olur. Yağmurlu gecelerde yıldız kaymaz.
- **Bahar yağmuru**: Yeşil bölgelerde ara sıra yağmur yağar. Gündüz yağmurun ardından gökkuşağı çıkar ve 40 saniye boyunca kredi ×1,5 olur.
- **Eve Dönüş ve Hatıralar**: Yolculuk 500.000 km'yi geçince Güçlendirmeler sekmesinden eve dönebilirsin. Kredi, araçlar,
  yükseltmeler, güçlendirmeler ve bölgeler sıfırlanır. Rozetler, istatistikler ve ayarlar kalır. Yolculuğun uzunluğuna göre
  hatıra kazanırsın (1 Mn km'de 10 hatıra; mesafe 8 katına çıkınca hatıralar 2 katına çıkar). Her hatıra sonraki yolculuklarda
  kalıcı olarak +%10 hız verir.
- **Yol Arkadaşı**: Güçlendirmeler'den bir kez alınan Karabaş, yürürken, paten ya da kaykayla, bisiklette ve at sırtında
  yanında koşar. Kalıcı +%10 kredi verir ve eve dönüşte de yolcuyla kalır.
- **Kartpostal**: HUD'daki fotoğraf makinesi düğmesi o anki manzarayı arayüzsüz, kenarlıklı bir kartpostala çevirir
  (bölge adı, yol, araç, tarih ve pul). Kartpostal indirilebilir; destekleyen cihazlarda doğrudan paylaşılabilir.
- **Rozetler**: Adım, kelebek, kayan yıldız, bölge, mesafe, garaj, yükseltme, eve dönüş ve kartpostal hedefleriyle 28 rozet. Her rozet kalıcı olarak +%3 kredi verir.
  Yol Defteri'nde görünür. Yol Defteri tutulan dilekleri ve çekilen kartpostalları da sayar.
- **Çevrimdışı ilerleme**: Oyun kapalıyken ya da sekme arka plandayken yolcu, otomatik hızın %30'u ile
  (güçlendirmeyle %90'a kadar) en fazla 8 saat (uzatılabilir) yürümeye devam eder.
- **Gündüz ve gece**: Sahne varsayılan olarak tarayıcının temasını izler. Açık tema güneşli gündüzdür, koyu tema fenerlerin yandığı
  yıldızlı gecedir. HUD'daki güneş/ay düğmesiyle ya da Yol Defteri > Ayarlar > Gökyüzü (Otomatik / Gündüz / Gece) seçimiyle
  tarayıcı temasından bağımsız olarak sabitlenebilir. Değişimde gün batımı ya da gün doğumuyla yumuşak bir geçiş olur.

İlerleme tarayıcının `localStorage` alanına otomatik kaydedilir.

## Diller ve ülkeler

Oyun Türkçe, İngilizce, Almanca, İspanyolca ve Fransızca oynanabilir. Dil tarayıcıdan otomatik seçilir;
tanıtım penceresinden ya da Yol Defteri → Ayarlar'dan değiştirilebilir.

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
| `public/js/data.js` | Araçlar, güçlendirmeler, rozetler, biyomlar, bölgeler, duraklar, ekonomi ve hatıra formülleri, sayı biçimleri |
| `public/js/scene.js` | Canvas sahnesi: paralaks katmanlar, gün/gece, biyom geçişleri, yağmur ve gökkuşağı, araç çizimleri, parçacıklar |
| `public/js/audio.js` | Web Audio ile üretilen sesler (dosya yok): adım, satın alma, rüzgâr, yağmur, rüzgâr çanları |
| `public/js/game.js` | Oyun durumu, döngü, kayıt, çevrimdışı ilerleme, hava olayları, rozetler, eve dönüş, gökyüzü ayarı, arayüz |
| `wrangler.jsonc` | Cloudflare Workers ayarı: statik varlık klasörü ve özel alan adı |

Tüm görseller kodla çizilir. Harici görsel ya da ses dosyası yoktur.
