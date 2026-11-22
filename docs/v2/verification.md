# V2 uygulama ve doğrulama kaydı

## 2.0.2 — 21 Kasım 2026

- Sefer ve filo kartlarında mevcut etap hızına göre sonraki yol ayrımına veya keşfe kalan yaklaşık dakika gösterilir. Karar ve ödül beklerken durum gösterilir.
- Seferi bırakma onayı panel yeniden çizilirken korunur, dört saniyede sona erer ve başka bir sefere taşınmaz. Önce başarısız tarayıcı assertion'ıyla yeniden üretildi, ardından düzeltme doğrulandı.
- `node tests/v2-run.js`: 8 paket geçti (234 denge rotası ve 39 sefer dahil).
- `node tests/v2-voyage-browser.js`: bırakma onayı, süre güncellemesi, güvenli rota hızı, son etap ve bağımsız filo sayacı geçti.
- `node tests/v2-browser.js`: kayıt/göç korumaları, kararlar, 12 dünya ve beş dilde 320 px açık/koyu sefer görünümü geçti. Türkçe mobil koyu, Fransızca mobil açık ve Türkçe masaüstü açık ekran görüntüleri görsel olarak incelendi; görüntüler `tests/out/v2-voyage-*.png` altında.
- `node tests/keys.js`: 899 anahtar/dil, eksik/fazla/yer tutucu/etiket farkı sıfır. Değişen JavaScript dosyaları sözdizimi denetiminden geçti.
- `bash tests/run-all.sh quick` tamamlandı. Eski `header`, `cycle`, `news` betikleri zaman aşımı bildirdi; `header` ve `news` tek başına otomatik yeniden denemede de zaman aşımına uğradı. Başlık ekran görüntüsünde V1 kaydının açtığı V2 karşılama penceresi arka plan kontrollerini engelliyor; eski ön yükleyici bu pencereyi atlamıyor. Bu koşu tümüyle başarılı kabul edilmez. Eski çalıştırıcı bazı başarısızlıklarda da sıfır çıkış kodu verdiğinden loglar kontrol edildi.
- Yerel sürüm adayı hazırlandı; commit, push veya canlı yayın yapılmadı.

### Devam kontrolü — 21 Kasım 2026

- Eski `header`, `cycle`, `news` testleri V1 kaydından sonra açılan V2 karşılama penceresini onaylayarak gerçek kullanıcı akışını izliyor. `bash tests/run-all.sh only header,cycle,news`: üç betik ve beş dil anahtar kontrolü geçti, çıkış kodu 0. Önceki hızlı koşudaki bu üç başarısızlık giderildi; tüm hızlı set bu devam turunda yeniden çalıştırılmadı.
- Shell çalıştırıcısı artık filtrelenmiş çıktının yerine alt sürecin çıkış kodunu saklıyor. Sessiz nonzero çıkış ve süre aşımı kaybolmuyor; tanınan çalışma zamanı hata logları da başarısız sayılıyor. İlk başarısız koşunun tam logu korunuyor; son başarısızlıklar ve yardımcı kontrollerin sonuçları genel çıkış koduna katılıyor.
- `node tests/runner-check.js`: önce eski çalıştırıcıda sessiz başarısızlığa rağmen 0 sonucu yeniden üretildi. Düzeltmeden sonra sessiz nonzero, loglanan `ReferenceError` ve başarılı alt betik kontrolleri geçti. Kontrol geçici betiklerini sonunda temizliyor ve regresyon setinden ayrı çalıştırılıyor.
- Bu devam turunda oyun kodu ve sürüm numarası değiştirilmedi; yerel aday 2.0.2 olarak kaldı.

Yerel sürüm adayı: **2.0.0**. Canlı yayın/push yapılmadı.

## İçerik

| Dünya | Seferler | Ana mekanik |
|---|---:|---|
| Yeryüzü | 3 | Keşif, teslimat ve geçit hazırlığı |
| Bulut Adaları | 3 | Liman bağlantıları, yük ve menzil |
| Fırtına Kuşağı | 3 | Korumalı kısa geçiş / güvenli dış rota |
| Yüksek Atmosfer | 3 | Enerji ikmali ve süzülüş |
| Gezegenler Sistemi | 3 | Tedarik yükü ve yörünge araştırması |
| Nebula Denizi | 3 | Görüşü açan ve geçişi hızlandıran tarama |
| Derin Uzay | 3 | Uzun geçişte rezerv tüketimi |
| Galaksinin Eşiği | 3 | Sinyal parçaları ve koordinat araştırması |
| Galaksilerarası Boşluk | 3 | Röleler, ikmal ve dönüş bağlantıları |
| Galaksiler Ağı | 3 | Bir ana sefer + üç bağımsız filo görevi |
| Kırık Uzay | 3 | Keşif/dayanıklılıkla kararlılık |
| Bilinmeyen Sınır | 6 | Mesajın çözümü ve yeni sistemde üç ek sefer |

Toplam 39 sefer, 78 yol ayrımı, 39 keşif kaydı. Bütün adlar, kararlar, keşif metinleri ve arayüz metinleri tr/en/de/es/fr içerir. Üç ek sefer `frontier-dawn` tamamlanmadan açılamaz; final yalnızca bir "yakında" kartı değildir.

## Kayıt güvenliği

- Ana anahtar: `idle-traveler-save-v1`; şema v4.
- İlk göç yedeği: `idle-traveler-save-v1-pre-v2`; yalnızca bir kez alınır.
- Güncel v4 kurtarma kopyası: `idle-traveler-save-v1-v4`. Eski v3 istemcisinin ana kayıttan v2 alanını düşürmesi hâlinde buradan kurtarılır.
- Eski istemcinin sonradan yazdığı en son v3 veri `idle-traveler-save-v1-legacy-after-v2` altında saklanır. Arşiv yazılamazsa geçerli v4 kayıt salt okunur açılır. İlk kurtarma kopyası göçte yazılıp doğrulanamıyorsa v3 kaynak üzerine yazılmaz. Sonraki yazma hatalarında kalıcı uyarı ve yeniden deneme görünür. Eski istemcide sonradan kazanılan değerler v4'e tahminle birleştirilmez.
- Daha yeni ana/kurtarma şeması üzerine yazılmaz. Ana ve kurtarma kayıtları her yazmadan hemen önce son okunan kopyayla karşılaştırılır.
- Bu yaklaşım sunucuda işlemli ortak kayıt değildir; localStorage temelli tek oyuncu modeli sürer.
- İsteğe bağlı tam sıfırlama v4 kurtarma kopyasını da siler; eve dönüş ise kalıcı keşif ve kampı korur.
- Depolama engelliyse v2 de oturum içinde oynanabilir; kayıt varmış gibi gösterilmez.

## Zaman ve ekonomi

Sefer işleri toplam ışık yılı sayısından bağımsız yerel iş bütçeleridir. İlk karar 300 sn; normal düğümler 300/240/240 sn; uzak düğümler 900/750/750 sn. Seçim beklerken yalnızca sefer durur. Arka plan ilerlemesi mevcut offline süre tavanını kullanır. Aktif ilerleme monotonik zamanı, gerçek uzun aralar duvar saatini kullanır; geriye alınan saatte kazanılmış aktif iş restorasyonda yeniden sayılmaz.

234 deterministik rota denemesinde (39 şablon × 3 araç × 2 karar politikası) süreler 649–2900 sn. İlk araştırma ödülü sefer başına bir kez 3 puandır. Kamp maliyetleri [3,5,7,9,11]; üç yapının toplamı 105, ilk keşif havuzu 117 puandır. Her yapı seviyesi ilgili yeteneğe +0,2, toplam yetenek en çok 5 verir.

Kredi ödülü sefere çıkıştaki temel gelirle sabitlenir; geçici çarpanlarla veya ödülü almadan önce yükseltme yaparak büyütülemez. Dört eşzamanlı en yüksek ödülü en hızlı aralıkla başlangıçtan itibaren ve bütün eski olayları da koruyarak modelleyen üç 48 saatlik simülasyonda Worker sınırının en yüksek kullanım oranı 0,004290 oldu. Bu başlangıç profili testi bütün olası eski kayıtların matematiksel ispatı değildir; mevcut makullük sınırını kaldırmaya gerek görülmedi.

## Doğrulama komutları

- `node tests/v2-run.js`: sekiz suite; başarısız assertion/eksik test nonzero döner. Göç, içerik, saat, ödül, filo, beş dil, denge ve Worker zarfı.
- `node tests/v2-browser.js`: sentetik eski/ileri kayıtlar; gerçek satın alma dışı sefer başlatma ve karar eylemleri; yedek, reload, hot kaynak, bozuk JSON, kota, future schema, depolamasız oturum, 2fps, saat geri alma, geciken storage olayı, eski istemci kurtarma ve 12 mobil dünya.
- `node tests/v2-performance-browser.js`: yerel 8765 sunucusu; 390×844, Galaksiler Ağı, 1 ana + 3 filo, 60 sn. Ölçüm: 3597 kare, p95 16,7 ms (başvuru hedefi <33 ms; gerçek telefon benchmark'ı değil).
- `node tests/keys.js`: 871 anahtar/dil, eksik/fazla/yer tutucu/etiket farkı sıfır.
- `bash tests/run-all.sh`: eski tam regresyon, i18n ve fuzz; eski betiklerin önemli bölümü assertion yerine log raporlar. Bu loglar tek başına bütün davranışların ispatı sayılmaz; kritik v2 yolları yeni assertion suite'leriyle doğrulanır.
- `bash tests/run-online.sh`: yerel D1 üzerinde Yolcular/sohbet/el sallama/kervan/pencere/mesafe koruması; altı bölümde çalışma zamanı hatası bildirilmedi.

Tarayıcı çalıştırma: test bağımlılıkları `tests/node_modules` altında. Bu makinede `PLAYWRIGHT_BROWSERS_PATH=C:/Users/veysi/AppData/Local/ms-playwright`. Ekran görüntüleri ve ayrıntılı çıktılar `tests/out/v2-*` altında, git dışında.

## Görsel kabul

12 dünya için hem atlas açık hem panel kapalı sahne görüntüsü alındı. Bulut Adaları ve Galaksinin Eşiği görsel olarak incelendi; ilk incelemedeki yanlış tema token'ları düzeltildi. Beş dilde 320 px koyu arayüz ve bütün dünyalarda 390 px azaltılmış hareket test edildi. Dünya geçişi 0,6 sn kararmayla; azaltılmış harekette anlık olur. Gerçek cihaz/touch ve uzun kullanıcı oyun testi yayın öncesi ayrıca yapılmalı.
