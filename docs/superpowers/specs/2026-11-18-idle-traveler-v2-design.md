# Idle Traveler 2 — Kendi Yolunu Çiz

Tarih: 2026-11-18
Durum: Konuşmada kabul edilen yönün yazılı tasarımı; bu belgedeki sayısal denge değerleri uygulamada ölçülecek başlangıç kararlarıdır.

## Amaç ve başarı

Daha çok araç eklemek yerine, ilerledikçe ekranı ve kararları değişen rahatlatıcı bir keşif oyunu oluşturmak. Ana döngü: kampta hazırlan → güzergâh seç → karşılaşmaları çöz → keşiflerle dön → kampı geliştir → farklı bir sefere çık.

Sıkılma nedeni henüz oyuncu ölçümleriyle doğrulanmış değil. Çalışma varsayımı: mevcut doğrusal kredi/yükseltme döngüsü bir noktadan sonra yeni karar üretmiyor. Başarı, yalnızca daha yüksek hız değil; oyuncunun bir sonraki keşfi merak etmesi ve aynı bölgede farklı bir hazırlığı denemek istemesi.

İlk oynanabilir örnekte yeni oyuncunun ilk anlamlı yol ayrımını 5–10 dakika içinde görmesi hedeflenir. Sonraki kararlar aktif oyunda yaklaşık 3–8 dakika aralıkla gelir. Bunlar test edilecek tempo hedefleridir, elde edilmiş sonuçlar değil. 100.000 ışık yıllık mevcut kayıtta ilk yeni içerik, göçten sonraki en fazla iki kullanıcı eylemiyle erişilebilir olmalı.

## Seçilen yaklaşım

1. Yalnızca araç/bölge eklemek daha ucuz, fakat doğrusal döngüyü koruyor.
2. Sezon ve rekabet geri dönüş sebebi olabilir, fakat sakin oyun kimliğine baskı getiriyor.
3. Sefer, uzmanlaşma ve değişen dünyalar temel kararları çeşitlendiriyor. Seçilen yaklaşım bu.

## Dünyalar ve ekranlar

- Yeryüzü: mevcut yakın yol sahnesi, kasabalar, ticaret ve keşif; kamp başlangıcı. İlk seferde keşif ve teslimat arasında seçim.
- Bulut Adaları: dikey derinlik, aşağıda dünya ve ayrı limanlar; ada bağlantıları ve teslimatlar.
- Fırtına Kuşağı: hareketli hava cepleri; güvenli rota veya hazırlık gerektiren kısa rota. Refleks zorunluluğu yok.
- Yüksek Atmosfer: seyrek hava, ince dünya eğrisi; süzülüş ve sefer içi enerjiyle istasyonlar arasında planlama.
- Gezegenler Sistemi: yörünge haritası ve yakın sefer görünümü; araştırma ve tedarik noktaları.
- Nebula Denizi: renkli hacimler ve kısıtlı görüş; tarama yaparak yolları açma. Rastgele düşmesi zorunlu anahtar yok.
- Derin Uzay: seyrek ışık, uzak hedefler ve keşif filosu; uzun sefer hazırlığı ve geçit bağlantıları.
- Galaksinin Eşiği: yıldızların seyrekleştiği sahne ve kaynağı bilinmeyen sinyal.
- Galaksilerarası Boşluk: yol çizgisi olmayan karanlık genişlik; istasyonları bularak güvenli bağlantılar kurma.
- Galaksiler Ağı: galaksi atlası; birden çok keşif gemisiyle farklı hatları geliştirme.
- Kırık Uzay: zaman/mesafe anomalileri; hazırlık ve geçit seçimi hızı tek başına yeterli olmaktan çıkarır.
- Bilinmeyen Sınır: önceki ipuçlarının çözüldüğü, tamamlanabilir bir hikâye bölümü; görünür sonraki soru. Boş bir “yakında” kartı final sayılmaz.

Kozmos alt bölgeleriyle galaksilerarası aşamalar aynı sıranın parçalarıdır. Mesafe bilimsel simülasyon değil, yolculuk ölçeğidir. Yeni dünyaların açılması keşif görevleriyle olur; salt mesafe ilerlemeyi otomatik bitirmez. Önceden edinilen dünya erişimi eve dönüşte kapanmaz.

## İlerleme ve mevcut oyuncular

- Mevcut kredi, araçlar, seviyeler, mesafe, toplam yol, koleksiyonlar, hatıralar, kimlik ve ayarlar korunur.
- Kayıt anahtarı korunur; mevcut şema `v:3`, yeni şema `v:4` olur. Ürün sürümü 2.0 ile kayıt şeması farklı kavramlardır.
- Göç öncesi ayrı ve bir kez yazılan v3 yedeği alınır. Yazılamazsa orijinal korunur, v2 göçü uygulanmaz; yeniden denenebilir açıklama gösterilir.
- Mevcut bozuk kayıt/iki sekme/saat geri alma korumaları sürer. Daha yeni, desteklenmeyen şema yazılarak düşürülmez.
- Uygunluk `max(distance, lifeDist, legacyDist)` ile hesaplanan arşivlenmiş uzaklıktan ve sahip olunan araçlardan türetilir. Ödül, hikâye tamamlama ve kaynak bu ölçümle otomatik verilmez.
- Balon veya daha ileride araç sahibi kayıt için gökyüzü giriş görevi; roket veya daha ileride araç sahibi kayıt için kozmos giriş görevi açılır. Dizin numarası yerine açık araç yetenekleri kullanılır.
- En az `100000 * IT.LY` metre arşiv uzaklığı olan kayıt Galaksinin Eşiği girişine doğrudan erişir. Önceki görevleri oynama zorunluluğu yok; isteğe bağlı geri dönüş var. Sinyal çözülmüş sayılmaz.
- Aktif araç değiştirmek dünyayı değiştirmez. Dünya, seçilen seferin konumudur; araç görünümü bu konuma uyarlanır.
- Sefer hedefleri ömür boyu mesafenin farkıyla ölçülmez: sefer başında belirlenen yerel iş bütçesiyle ölçülür. Böylece eski kayıtlar görevi tek karede bitirmez veya yeni oyuncular astronomik eşiğe mahkûm olmaz.

## Sefer sözleşmesi

Aynı anda bir ana sefer; Galaksiler Ağı açıldığında en çok üç filo görevi. Her sefer 3–5 düğüm, en az iki sonuçları önceden gösterilen yol seçimi ve kalıcı bir keşif/bağlantı getirir. Normal sefer ilk denge hedefi 10–20 dakika, uzun sefer 30–60 dakika; çevrimdışı süre politikası aynı sınırları kullanır.

Durum: idle → traveling → awaitingChoice → traveling → readyToClaim → idle. Seçim beklerken sefer işi durur, mevcut idle kredi ve yol kazancı devam eder. Açıkça seçilmiş güvenli otomasyon politikası varsa yalnızca önceden yetkilendirilen seçimler yapılır; varsayılan otomasyon kapalıdır. Hikâye seçimleri otomatik yapılmaz.

Sefer başında bölge, ekipman ve temel üretim hızı sabitlenir; geçici çarpanlar sefer ödülünü şişirmez. Sıfır hıza sahip kayıtta da temel iş hızı 1 iş/sn. Fırtına/enerji kaynakları seferle sınırlıdır. Düşük hazırlık daha yavaş veya daha düşük ek ödüllü güvenli sonuç verir; araç/kalıcı ilerleme silinmez. Seferden vazgeçmek harcanan sefer sarfını geri vermez, kalıcı ilerlemeyi etkilemez.

## Araçlar, ekipman, kamp

Mevcut bütün araçlar ve ekonomileri ilk etapta korunur. Araçlara dört yetenek atanır: keşif, yük, dayanıklılık, menzil; değerler 1–5. Her aile en az bir sefer türünde anlamlı avantaj taşır. Avantajlar sınırlı ve açıklanır; ham kredi gelirine yeni sınırsız çarpan eklenmez.

İki ekipman yuvası: gövde ve yardımcı. Her yuvada üç karşılıklı alternatif; değişim kampta ücretsiz. İlk sürümde rastgele nadirlik ve envanter yığını yok. Mürettebat birey biriktirmek yerine üç sabit rol: kılavuz, mühendis, araştırmacı; filo görevi başına bir rol.

Kamp üç yapıdan başlar: atölye (ekipman), gözlemevi (tarama), iskele (bağlantılar/filo). Her biri 5 seviye, sınırlı etkiler ve görünür fiziksel gelişim. Ana keşif kaynağı araştırma puanı; ikincil kalıcı para eklenmez. Sefer enerjisi ve yük yalnızca o seferin durumu olarak tutulur. Kalıcı keşif puanı ilk kez tamamlanan düğümlerden bir defa verilir; tekrar seferleri sınırlı kredi ve farklı rota denemesi içindir.

## Merak ve içerik

Her bölge için en az 3 sefer şablonu, her şablonda en az 2 anlamlı yol seçimi. Aynı metni farklı adla çoğaltmak kapsamı karşılamaz. Her bölgenin biri giriş, biri yerel çözüm, biri sonraki bölgeye işaret eden en az 3 özgün keşif parçası olur. İpucu defteri kaynağı ve kalan soruyu gösterir; harita erişilemeyen hedefin nasıl açılacağını söyler, sürprizin cevabını açıklamaz.

## Arayüz, ses ve erişilebilirlik

Kalıcı gezinme: Yolculuk, Atlas, Kamp, Garaj, Defter. Mobilde sahne + tek alt panel; aynı anda tüm sistemler gösterilmez. Kredi, ayarlar ve kayıt durumu tanıdık yerde kalır. Atlasın dokunma hedefleri DOM düğmeleridir; Canvas tek erişim yolu olmaz. 320/390/768/1440 px, dikey/yatay, beş dil, gündüz/gece ve azaltılmış hareket desteklenir. Dünya geçişi azaltılmış harekette kısa kararma ile yapılır; yanıp sönme yok. Ses dış dosya zorunluluğu olmadan mevcut Web Audio yaklaşımıyla üretilir.

## Teknik sınırlar ve kapsam dışı

Vanilla JavaScript, Canvas 2D, CSS, Web Audio ve mevcut Cloudflare Worker/D1 korunur; çerçeve veya zorunlu derleme eklenmez. Yeni saf kurallar ayrı `IT.V2` modüllerinde, mevcut game.js kayıt/döngü adaptörü olarak kalır. Yeni sefer sistemi ağ olmadan çalışır.

V2 ilk yayında PvP, sezon baskısı, ödeme sistemi, zorunlu günlük giriş, açık uçlu prosedürel hikâye ve paylaşılan sunucu ekonomisi içermez. Toplam yol sıralaması korunur; yeni keşif için rekabet sıralaması eklenmez. V2 üretim hızını değiştirdiği ölçüde Worker makullük eğrisi yeniden ölçülür.

## Yayın şartı

Tüm dünya aileleri ve uzak evren hattı oynanabilir olmadan 2.0 duyurulmaz. Önce yeryüzü + Bulut Adaları dikey dilimi; ardından gökyüzü/kozmos; sonra galaksilerarası içerik ve tam kabul. Açık v1.67 değişiklikleri ayrı başlangıç durumu olarak korunur. Ürün kodu bu planlama çalışmasında değiştirilmez.
