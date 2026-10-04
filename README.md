# Idle Traveler

Manzaralı bir yolda geçen, tarayıcıda çalışan rahatlatıcı bir idle (rölanti) oyunu.
Sırt çantalı bir yolcu yürüyerek başlar. Her tıklama bir adımdır, kat edilen her metre kredi kazandırır.
Kredilerle yeni araçlar, araç yükseltmeleri ve kalıcı güçlendirmeler alınır.

## Oynamak

Derleme adımı yok. `index.html` dosyasını tarayıcıda açman yeterli.
İstersen basit bir sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Yayın: idle-traveler.vebaban.com

Oyun GitHub Pages ile `https://idle-traveler.vebaban.com` adresinde yayınlanacak şekilde hazırlandı.

1. **GitHub**: Repo → *Settings → Pages → Build and deployment → Source* alanını **GitHub Actions** yap.
   `main` dalına her push'ta `.github/workflows/pages.yml` siteyi yayınlar.
2. **DNS** (vebaban.com'un DNS sağlayıcısında): bir CNAME kaydı ekle.

   | Tür | Ad | Değer |
   | --- | --- | --- |
   | CNAME | `idle-traveler` | `veysiemrah.github.io` |

   Cloudflare kullanıyorsan kaydı önce **DNS only** (gri bulut) olarak ekle. Sertifika çıktıktan sonra proxy'yi açabilirsin.
3. **GitHub**: *Settings → Pages → Custom domain* alanında `idle-traveler.vebaban.com` görünmeli
   (repo kökündeki `CNAME` dosyası bunu sağlar). DNS doğrulandıktan sonra **Enforce HTTPS** kutusunu işaretle.

## Oyun

- **Adım at**: Sahneye dokun ya da Boşluk tuşuna bas. Hızlı ve ritmik tıklamalar *Ritim* bonusunu doldurur.
- **Araçlar**: Yürüyüş → Paten → Bisiklet → Motosiklet → Araba → Tren → Uçak → Roket → Güneş Yelkeni.
  Her aracın kendi yükseltme hattı var. Her seviye +%25 hız verir, 10, 25, 50… seviyelerde hız ikiye katlanır.
  Uçakla birlikte kamera bulutların arasına yükselir, roketle uzaya çıkılır.
- **Güçlendirmeler**: Güçlü Adımlar, Arkadan Esen Rüzgâr, Kartpostal Koleksiyonu (kredi), Yolun Ritmi,
  Şanslı Adım (10 kat uzun adım), Rüyada Yolculuk (çevrimdışı hız), Uzun Mola (çevrimdışı süre), Kelebek Dostu.
- **Bölgeler**: Sabah Köyü, Lavanta Tarlaları, Çam Ormanı, Altın Buğday Ovası, Ege Sahil Yolu, Kızıl Kanyon,
  Kiraz Çiçeği Vadisi, Sonbahar Korusu, Vaha Yolu, Karlı Geçit, Kuzey Işıkları, Rize Çay Bahçeleri, Peri Bacaları…
  Her yeni bölge pasaporta bir damga ekler ve kalıcı olarak +%6 hız verir.
- **Duraklar**: Maraton, İstanbul – Ankara, Dünya turu, Ay'a varış, Proxima Centauri… gibi gerçek mesafeler.
- **Altın kelebek**: Arada bir gökyüzünden geçer. Yakalarsan hız ×3, kredi ×2, tıklama ×5 ya da anında kredi verir.
- **Çevrimdışı ilerleme**: Oyun kapalıyken ya da sekme arka plandayken yolcu, otomatik hızın %30'u ile
  (güçlendirmeyle %90'a kadar) en fazla 8 saat (uzatılabilir) yürümeye devam eder.
- **Tema**: Sahne tarayıcının temasını izler. Açık tema güneşli gündüzdür, koyu tema fenerlerin yandığı yıldızlı gecedir.
  Tema değişince gün batımı ya da gün doğumuyla yumuşak bir geçiş olur.

İlerleme tarayıcının `localStorage` alanına otomatik kaydedilir.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa iskeleti, HUD ve panel |
| `css/style.css` | Arayüz stilleri, açık/koyu tema token'ları |
| `js/data.js` | Araçlar, güçlendirmeler, biyomlar, bölgeler, duraklar, ekonomi formülleri, sayı biçimleri |
| `js/scene.js` | Canvas sahnesi: paralaks katmanlar, gün/gece, biyom geçişleri, araç çizimleri, parçacıklar |
| `js/audio.js` | Web Audio ile üretilen sesler (dosya yok): adım, satın alma, rüzgâr, rüzgâr çanları |
| `js/game.js` | Oyun durumu, döngü, kayıt, çevrimdışı ilerleme, arayüz |

Tüm görseller kodla çizilir. Harici görsel ya da ses dosyası yoktur.
