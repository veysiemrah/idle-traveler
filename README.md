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
- **Araçlar**: Yürüyüş → Paten → Bisiklet → Motosiklet → Araba → Tren → Uçak → Roket → Güneş Yelkeni.
  Her aracın kendi yükseltme hattı var. Her seviye +%25 hız verir, 10, 25, 50… seviyelerde hız ikiye katlanır.
  Uçakla birlikte kamera bulutların arasına yükselir, roketle uzaya çıkılır.
- **Yol tecrübesi**: Hızını garajdaki en güçlü araç belirler, diğer araçlar hızlarının yarısını katar. Yeni araca her zaman
  hemen binilir. Hangi araca bindiğin yalnızca görünümü değiştirir; hız asla düşmez, eski yükseltmeler boşa gitmez.
- **Toplu yükseltme**: Garajın üstündeki ×1 / ×10 / Maks seçimiyle tek dokunuşta birden çok seviye alınır.
- **Güçlendirmeler**: Güçlü Adımlar, Arkadan Esen Rüzgâr, Kartpostal Koleksiyonu (kredi), Yolun Ritmi,
  Şanslı Adım (seviye başına %1 ihtimalle 5 kat uzun adım), Rüyada Yolculuk (çevrimdışı hız), Uzun Mola (çevrimdışı süre), Kelebek Dostu.
- **Bölgeler**: Sabah Köyü, Lavanta Tarlaları, Çam Ormanı, Altın Buğday Ovası, Ege Sahil Yolu, Kızıl Kanyon,
  Kiraz Çiçeği Vadisi, Sonbahar Korusu, Vaha Yolu, Karlı Geçit, Kuzey Işıkları, Rize Çay Bahçeleri, Peri Bacaları…
  Her yeni bölge pasaporta bir damga ekler ve kalıcı olarak +%6 hız verir.
- **Duraklar**: Maraton, İstanbul – Ankara, Dünya turu, Ay'a varış, Proxima Centauri… gibi gerçek mesafeler.
- **Altın kelebek**: Arada bir gökyüzünden geçer. Yakalarsan hız ×3, kredi ×2, tıklama ×5 ya da anında kredi verir.
- **Bahar yağmuru**: Yeşil bölgelerde ara sıra yağmur yağar. Gündüz yağmurun ardından gökkuşağı çıkar ve 40 saniye boyunca kredi ×1,5 olur.
- **Rozetler**: Adım, kelebek, bölge, mesafe, garaj ve yükseltme hedefleriyle 22 rozet. Her rozet kalıcı olarak +%3 kredi verir.
  Yol Defteri'nde görünür.
- **Çevrimdışı ilerleme**: Oyun kapalıyken ya da sekme arka plandayken yolcu, otomatik hızın %30'u ile
  (güçlendirmeyle %90'a kadar) en fazla 8 saat (uzatılabilir) yürümeye devam eder.
- **Tema**: Sahne tarayıcının temasını izler. Açık tema güneşli gündüzdür, koyu tema fenerlerin yandığı yıldızlı gecedir.
  Tema değişince gün batımı ya da gün doğumuyla yumuşak bir geçiş olur.

İlerleme tarayıcının `localStorage` alanına otomatik kaydedilir.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `public/index.html` | Sayfa iskeleti, HUD ve panel |
| `public/css/style.css` | Arayüz stilleri, açık/koyu tema token'ları |
| `public/js/data.js` | Araçlar, güçlendirmeler, rozetler, biyomlar, bölgeler, duraklar, ekonomi formülleri, sayı biçimleri |
| `public/js/scene.js` | Canvas sahnesi: paralaks katmanlar, gün/gece, biyom geçişleri, yağmur ve gökkuşağı, araç çizimleri, parçacıklar |
| `public/js/audio.js` | Web Audio ile üretilen sesler (dosya yok): adım, satın alma, rüzgâr, yağmur, rüzgâr çanları |
| `public/js/game.js` | Oyun durumu, döngü, kayıt, çevrimdışı ilerleme, hava olayları, rozetler, arayüz |
| `wrangler.jsonc` | Cloudflare Workers ayarı: statik varlık klasörü ve özel alan adı |

Tüm görseller kodla çizilir. Harici görsel ya da ses dosyası yoktur.
