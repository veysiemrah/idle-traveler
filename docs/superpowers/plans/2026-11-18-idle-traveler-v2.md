# Idle Traveler 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Uygulama tek oturumda aşamalı yürütülebilir; bu belge uygulama başlatmaz.

**Goal:** İlerledikçe ekranı ve kararları değişen, 100.000 ışık yılına ulaşmış kayıtlar için de yeni merak hedefleri sunan Idle Traveler 2.0.

**Architecture:** Mevcut `IT` ad alanı ve derlemesiz uygulama korunacak. Saf içerik, sefer, göç ve keşif kuralları `IT.V2` modüllerine; dünya çizimleri ayrı sahne modülüne ayrılacak. `game.js` kayıt, zaman ve DOM entegrasyonunu yönetecek; sefer konumu ile aktif araç birbirinden bağımsız olacak.

**Tech Stack:** Vanilla JavaScript, Canvas 2D, CSS, Web Audio, localStorage; Node assert ve Playwright; mevcut Cloudflare Worker/D1.

**Spec:** [V2 tasarımı](../specs/2026-11-18-idle-traveler-v2-design.md). Tasarımdaki yeni denge sayıları başlangıç varsayımlarıdır; görev 12 ölçümleriyle son hâle getirilecek.

## Global Constraints

- Mevcut kredi, araçlar, seviyeler, mesafe, toplam yol, koleksiyonlar, hatıralar, kimlik ve ayarlar korunur.
- Kayıt anahtarı korunur; mevcut şema `v:3`, yeni şema `v:4` olur. Ürün sürümü 2.0 ile kayıt şeması farklı kavramlardır.
- En az `100000 * IT.LY` metre arşiv uzaklığı olan kayıt Galaksinin Eşiği girişine doğrudan erişir.
- Çevrimdışı ilerleme sürer; zorunlu seçimde yalnızca sefer durur, temel idle gelir sürer.
- Araç/kalıcı ilerleme kaybettiren başarısızlık yok; yetenekler ve kamp bonusları sınırlıdır.
- 320/390/768/1440 px, dikey/yatay, beş dil, gündüz/gece ve azaltılmış hareket desteklenir.
- Vanilla JavaScript, Canvas 2D, CSS, Web Audio ve mevcut Cloudflare Worker/D1 korunur; çerçeve veya zorunlu derleme eklenmez.
- Tüm dünya aileleri ve uzak evren hattı oynanabilir olmadan 2.0 duyurulmaz.

## Review Focus

1. Çok ileri kayıt göçte görevleri otomatik bitirmemeli; görev 3 ve 5 tam 100.000 LY ve çok büyük sonlu değerleri test eder.
2. Ödül toplama + yeniden yükleme/iki sekme aynı ödülü çoğaltmamalı; görev 2, 4 ve 7 bunu tekrar çağrıyla test eder.
3. Uyku/saat geri alma/seçim penceresi çevrimdışı işi iki kez saymamalı; görev 4 zaman bölünmesi eşitliği test eder.
4. Eski v1 içeriği, kimlik ve kayıt koruması yeni gezintide kaybolmamalı; görev 2, 6 ve 13 regresyonla doğrular.
5. Dokunma ve klavye erişimi ile beş dilde uzun metinler bütün dünya ekranlarında kullanılabilir kalmalı; görev 6, 8, 9 ve 11 doğrular.

## Mevcut durum ve dosya haritası

Mevcut `game.js` kayıt şeması 3; `KEEP` eve dönüşte kalacak alanları tanımlar; `frame()` açık sekme ve `resume()` çevrimdışı ilerlemeyi işler. `data.js` içindeki rotalar ağırlıkla biyom sırası ve perk değiştirir. `scene.js` tek `Scene` sınıfı, araç irtifası ve uzay karışımı kullanır. Bu yapılar topluca yeniden yazılmayacak.

Yeni dosyalar:

| Dosya | Sorumluluk |
|---|---|
| `public/js/v2/content.js` | Dünya, düğüm, sefer, ipucu ve araç yetenek tanımları; Node/tarayıcı ortak veri |
| `public/js/v2/migration.js` | Saf şema göçü ve uzak kayıt erişimi |
| `public/js/v2/expeditions.js` | Sefer durum makinesi, zaman ilerletme, seçim ve ödül sonucu |
| `public/js/v2/progression.js` | Kamp, ekipman, roller, sınırlı ödüller ve kalıcı açılışlar |
| `public/js/v2/views.js` | Atlas/kamp/sefer DOM görünümü ve kullanıcı eylemleri |
| `public/js/v2/world-scenes.js` | Mevcut sahneyle ortak Canvas kullanan dünya çizimleri ve etkileşim bölgeleri |
| `public/css/v2.css` | Yeni panel, atlas, dünya HUD ve erişilebilirlik stilleri |
| `tests/v2-*.js` | Saf kural, tarayıcı, kayıt, erişilebilirlik ve performans testleri |
| `tests/fixtures/v2/` | Anonim/sentetik başlangıç, orta, 100.000 LY ve bozuk kayıt örnekleri |
| `docs/v2/` | İçerik matrisi, denge sonuçları, görsel kabul ve yayın kontrolü |

Mevcut değişecek dosyalar: `public/index.html` (sıralı script/CSS yükleme), `game.js` (adaptörler), `scene.js` (dünya çizim kancası), `audio.js` (ses ortamları), `data.js` (ekonomiyle sınırlı entegrasyon), beş dil sözlüğü, `changelog.js`, Worker makullük sınırı, test çalıştırıcıları ve README. Yeni saf modüller `globalThis.IT.V2` altında da yüklenebilir olmalı; DOM'a modül üst seviyesinde dokunmamalı.

## Uygulama sırası ve teslim kapıları

A. Güvenli temel: görev 1–4. Kayıt ve çevrimdışı doğrulama geçmeden oynanış eklenmez.
B. Oynanabilir dikey dilim: görev 5–8. Yeryüzü + Bulut Adaları döngüsü; ilk kullanıcı denemesi burada. V2 adıyla yayınlanmaz.
C. Tam dünyalar: görev 9–11. Gökyüzü, kozmos, uzak evren ve keşif anlatısı.
D. Denge ve yayın: görev 12–13. Tam regresyon ve eski oyuncu kabulü.

Denge denemesinde tek strateji her sefer türünde üstün çıkarsa B kapısına geri dönülür. Yeni mekanik ekleyerek sorunun üstü kapatılmaz.

## Ortak veri ve API sözleşmesi

- `V2State = { schema:1, worldId, unlockedWorlds:string[], completedNodes:string[], claimedRewards:string[], research:number, camp:{workshop:number,observatory:number,dock:number}, equipment:{hull:string|null,utility:string|null}, roles:{}, clues:string[], expedition:Expedition|null, fleet:Expedition[], onboardingSeen:boolean }`.
- `Expedition = { id, templateId, nodeId, status, workDone, workRequired, workRate, loadout, choices:[], seed, resources:{energy,cargo}, rewardClaimed:false }`. Durumlar tasarımdaki durum makinesiyle sınırlı. Başlatma ve ödül kimlikleri kalıcı ve benzersiz.
- `Transition = { state:V2State, effects:Array<{type, payload}>, consumedSeconds:number }`; fonksiyonlar giriş durumunu değiştirmez. Efekt uygulaması ve kayıt aynı oyun eyleminde yapılır; kalıcı token ile tekrar uygulama engellenir.
- Süre girdileri sonlu ve negatif olmayan saniyedir. Offline tavanı mevcut oyuncu camp buff'ından alınır; yeni kamp iskele seviyesi bu süreyi tekrar çarpmaz.
- `SceneView = {worldId,nodeId,travelProgress,landmarks:[],weather,scanReveal,transitionProgress}`; yalnızca gösterim verisi, kayıt yazma veya ödül verme yetkisi yok.
- Script sırası: i18n/diller → changelog → data → v2 content/migration/expeditions/progression → online/audio → scene → v2 world-scenes/views → game.

### Task 1: Başlangıç kaydı ve gerçek regresyon tabanı

**Files:** Create: tests/fixtures/v2/{new,mid,far,corrupt}.json; tests/v2-baseline.js; docs/v2/baseline.md. Modify: tests/lib/pw.js, tests/run-all.sh, tests/run-online.sh yalnızca çıkış kodu güvenirliği gerekiyorsa.

**Interfaces:** Consumes: mevcut v3 kayıt biçimi. Produces: adı/key alanları sentetik, far.distance=100000*IT.LY olan fixture ve `{pass,fail,skipped}` sonucu; test hatasında sıfırdan farklı süreç kodu.

- [ ] **Step 1 — Başarısız test:** Bir başarısız assertion ve pageerror örneğinin çalıştırıcıyı başarısız yapmasını; eksik testin PASS sayılmamasını doğrula. Şu anki grep tabanlı log özeti tek başına kanıt sayılmasın.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-baseline.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Test sunucusu/oyuncu seed ortak yardımcısını ve başarısızlık yayılımını kur. Açık v1.67 değişikliklerini veya kullanıcıya ait package-lock/debug dosyalarını ezme. Mevcut ana regresyonu çalıştır; önceden var olan es/fr toast.badge yer tutucu farklarını ayrı kaydet, yeni hataları baseline diye kabul etme.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Başarısız örnek nonzero; sağlam örnek PASS. Baseline belgesinde gerçekten çalıştırılan testler ve başlangıç hataları bulunur.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 2: Güvenli v4 göçü ve geri kazanım

**Files:** Create: public/js/v2/migration.js; tests/v2-migration.js; tests/v2-save-browser.js. Modify: public/js/game.js load/sanitize/save/KEEP; public/index.html.

**Interfaces:** Produces: IT.V2.migrateV3(save)->saveV4; IT.V2.sanitizeState(raw)->V2State. Backup key: idle-traveler-save-v1-pre-v2. Eski bozuk kayıt yedeği ayrı kalır.

- [ ] **Step 1 — Başarısız test:** assert.deepEqual(migrateV3(migrateV3(far)),migrateV3(far)); kredi/mesafe/kimlik ve owned korunur; NaN/Infinity temizlenir. Desteklenmeyen v5 yazılmaz. Kota hatasında ana kayıt byte olarak aynıdır; iki sekme korunur; göç bildirimi tekrar çıkmaz.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-migration.js; node tests/v2-save-browser.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Göçü saf uygula; yedek başarıyla yazılıp geri okunmadan v4 kaydı yazma. Mevcut saveLocked/otherTab/noStorage davranışlarıyla entegre et. V2 alanını KEEP içine ekle, tamamlanmış keşifler eve dönüşte kalır. İş gören sefer varken eve dönüş açık onayla seferi iptal eder; ödül üretmez.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Tüm v1/v2/v3 fixtureları okunur, idempotence ve kota/iki sekme senaryoları geçer.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 3: Dünya grafiği ve ileri kayıt girişleri

**Files:** Create: public/js/v2/content.js; tests/v2-content.js; tests/v2-unlocks.js; docs/v2/content-matrix.md.

**Interfaces:** Produces: IT.V2.WORLDS, TEMPLATES, VEHICLE_ROLES; eligibility(save)->string[]; availableEntries(save)->string[]. World IDs: earth, cloud, storm, upper, planets, nebula, deep, rim, void, galaxies, fracture, frontier.

- [ ] **Step 1 — Başarısız test:** assert(eligibility(far).includes("rim")); eşikten 1 metre az ve tam eşik ayrımı. Sadece lifeDist/legacyDist yüksekken erişim. Her mevcut araç ID’sinin dört 1–5 yeteneği; bilinmeyen araç güvenli varsayılan. Grafikte ulaşılamayan düğüm/kayıp çeviri anahtarı olmaz. Hiçbir erişim kontrolü hikâye ödülünü vermez.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-content.js; node tests/v2-unlocks.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Dünya grafiğini ve erişim ön koşullarını veri olarak tanımla. Yeni oyuncu dünyaları giriş görevleriyle açar; göç oyuncusunun girişleri araç yeteneği/arşiv uzaklığıyla sunulur. Bölge başına 3 sefer ve 3 ipucu kapsamını matriste say; ilk etapta eksik içerik geliştirme ortamında açıkça raporlansın, final kapısında hata olsun.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Eşikler ve erişim testleri PASS; far oyuncusu rim girişini görebilir, completedNodes/araştırma hâlâ boştur.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 4: Deterministik sefer motoru ve offline ilerleme

**Files:** Create: public/js/v2/expeditions.js; tests/v2-expeditions.js; tests/v2-offline.js. Modify: game.js frame/resume/pagehide entegrasyonu.

**Interfaces:** Produces: startExpedition(state,templateId,loadout,seed)->Transition; advance(state,seconds,{offline,capSeconds})->Transition; choose(state,choiceId)->Transition; claimExpedition(state)->Transition; abandonExpedition(state)->Transition.

- [ ] **Step 1 — Başarısız test:** Start→seçim→varış→claim yaşam döngüsü. 600 saniye tek çağrı ile 60 adet 10 saniye eşit; choice sınırında kalan süre doğru; tekrar claim ödülsüz; negatif/NaN süre etkisiz; saat geri gidince tekrar kredi yok; 8+ saat uyku buff tavanını aşmaz. Seçim beklerken base idle gelir sürer.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-expeditions.js; node tests/v2-offline.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Düğüm bütçelerini sefer başındaki temel hızla normalize et; workRate=max(1, snapshotBaseRate), süre bütçesi workRate*targetSeconds. S.distance farkı ve geçici efektlerden ilerleme türetme. Aynı advance yolu hem aktif hem offline çalışır; seçim sınırında consumedSeconds ile kalan zamanı yönet. Base gelir zaten resume tarafından verildiği için ikinci kez ekleme.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Bölünmüş süre eşitliği, sonlu durumlar, tam bir kez claim ve offline karşılaştırmaları PASS.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 5: Yeryüzü oynanabilir seferi ve gerçek yol ayrımı

**Files:** Modify: v2/content.js, game.js. Create: tests/v2-earth.js.

**Interfaces:** Consumes: start/advance/choose/claim. Produces: earth-survey, earth-delivery, earth-pass şablonları; her biri 3–5 düğüm ve en az iki seçim.

- [ ] **Step 1 — Başarısız test:** Keşif ve teslimat seçimlerinde kaynak/keşif sonuçları farklı; aynı seed aynı sonuç; aynı seferi tekrar oynayınca ilk keşif puanı çoğalmaz; farklı araç hazırlığı en az bir seçim sonucunu değiştirir. Yeni oyuncunun ilk seçim için zorunlu araç satın alma kilidi yoktur.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-earth.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Üç şablonu açıklanan sonuçlarla yaz. İlk denemede rastgele ölüm/başarısızlık yok. Sonraki gökyüzü girişini ilk yeryüzü keşif dizisinin ödülü yap; uzak kayıt bunu oynamak zorunda kalmaz.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: İki farklı seçim dizisi iki farklı sonuç üretir; sefer tamamlanır, kalıcı keşif görünür ve yeni hedef açılır.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 6: Atlas, kamp ve sefer gezinmesi

**Files:** Create: public/js/v2/views.js; public/css/v2.css; tests/v2-ui.js. Modify: index.html, game.js, beş dil sözlüğü.

**Interfaces:** Produces: IT.V2.Views.mount(root,onAction); render(v2State,viewModel); destroy(). Eylemler: start, choose, claim, abandon, equip, upgradeCamp, selectWorld. DOM dataset ID değerleri içerik ID’leriyle aynıdır.

- [ ] **Step 1 — Başarısız test:** Far fixture en fazla iki tıkla rim seferini başlatır. Klavyeyle atlas düğümleri seçilir; modal kapanınca odak döner; garaj/defter/ayarlar erişilebilir. 320 px es/fr/de uzun metinler yatay taşmaz; kapalı dünya açılma koşulunu gösterir.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-ui.js; node tests/keys.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Yolculuk/Atlas/Kamp/Garaj/Defter gezintisini ve tek aktif mobil paneli ekle. Eski Yolcular ekranı mevcut erişim noktasında kalır. V2 view state’i oyun state’inden ayır; render başına event handler biriktirme. Atlas DOM düğmeleri Canvas ile eşleşir; klavye alternatifi tamdır.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: 5 dil, masaüstü/telefon ve klavye testleri PASS; temel kontroller ve v1 koleksiyonları erişilebilir.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 7: Araç uzmanlıkları, ekipman ve kalıcı kamp

**Files:** Create: public/js/v2/progression.js; tests/v2-progression.js. Modify: content.js, views.js, game.js.

**Interfaces:** Produces: loadoutStats(vehicleId,equipment,role,camp)->{explore,cargo,endurance,range}; upgradeCamp(state,building)->Transition; equip(state,slot,itemId)->Transition; applyDiscovery(state,rewardId)->Transition.

- [ ] **Step 1 — Başarısız test:** Her aile en az bir sefer türünde avantajlı; bir araç tüm seçeneklerde baskın değil. İki yuva, üç alternatif ve ücretsiz kamp değişimi. Yapı seviyesi 5’i aşmaz; yetersiz araştırma harcanmaz; aynı rewardId iki kez işlenmez. Eve dönüş keşif/kampı korur.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-progression.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Atölye/gözlemevi/iskele seviyelerini 0–5 uygula; rol ve ekipman etkilerini yeteneklerin 1–5 sınırına sıkıştır. İlk araştırma kazancı 3, yapı maliyetleri seviye başına [3,6,10,15,21]; bunları görev 12’de ölç. Bütün ilk keşiflerin toplamı zorunlu açılış maliyetlerini karşılamalı. Sınırsız kredi çarpanı ekleme.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Ekonomi korunumu, tekrar ödül koruması, kamp görünüm kademeleri ve eski araç faydası testleri PASS.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 8: Yeryüzü–Bulut Adaları görsel dikey dilimi

**Files:** Create: public/js/v2/world-scenes.js; tests/v2-scene-cloud.js; docs/v2/visual-acceptance.md. Modify: scene.js, audio.js, views.js.

**Interfaces:** Produces: IT.V2.WorldScene.draw(ctx,viewport,SceneView,time); hitRegions(SceneView,viewport)->rect[]; Scene.setWorldView(SceneView). earth görünümünde mevcut çizim yolu korunur.

- [ ] **Step 1 — Başarısız test:** Aynı araçla earth/cloud ekran görüntüleri yapısal olarak farklı; limanların DOM ve Canvas hitboxları zoom/DPR/resize sonrası eşleşir. reduced-motion geçişi animasyonsuz, tıklama yeni düğüme sızmaz. Kayıt açınca worldId korunur; araç değiştirmek worldId değiştirmez.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-scene-cloud.js; node tests/layout.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Bulut katmanları, aşağıdaki dünya, limanlar ve bağlantı çizgilerini çiz. cloud-delivery/cloud-survey/cloud-link şablonlarını tamamla. Dünya geçişini kullanıcı eylemiyle başlat; sabit HUD ve bağlama göre değişen sefer kontrollerini kur. Aynı Canvas üzerinde ikinci RAF döngüsü açma.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Yeni oyuncu earth→cloud→kamp tam döngüsünü oynar. Görsel kabulde masaüstü ve 320 px gündüz/gece görüntüleri insan gözüyle incelenmiş olur.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 9: Gökyüzünün iki farklı oynanışı

**Files:** Modify: content.js, expeditions.js, world-scenes.js, audio.js, views.js. Create: tests/v2-sky.js.

**Interfaces:** Consumes: ortak sefer ve SceneView. Produces: storm güvenli/kısa rota kararları; upper süzülüş/istasyon enerji kararları. Her bölgeye üç özgün şablon.

- [ ] **Step 1 — Başarısız test:** Storm hazırlıksız oyuncuya güvenli çıkış verir, fırtına için çevrimiçi refleks gerekmez. Upper enerjisi sıfırken sonsuz kilit/araç kaybı olmaz. Offline seçim bekler; ses kapalı kalır. Klavye ve 320 px dokunma seçenekleri çalışır.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-sky.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Fırtına hücreleri ve yüksek atmosfer eğrisi için ayrı çizim/ambient oluştur. Enerji sefer içinde yeniden dolan, kalıcı para olmayan sayaçtır. Geçici hava bonusu base ekonomiye sınırsız katlanmaz. Üst atmosfer finali kozmos giriş görevini açar.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Cloud/storm/upper oynanışları farklı karar türleri üretir ve üçü de çevrimdışı güvenle tamamlanabilir.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 10: Kozmos: yörünge, tarama ve filo

**Files:** Modify: content.js, expeditions.js, progression.js, views.js, world-scenes.js, audio.js. Create: tests/v2-cosmos.js.

**Interfaces:** Produces: planets araştırma/tedarik düğümleri, nebula deterministik tarama açılışları, deep uzun sefer ve geçitler. startFleet(state,slot,templateId,role,seed)->Transition; slot üst sınırı 3, galaxies öncesi kilitli.

- [ ] **Step 1 — Başarısız test:** Gezegen tedariki ve araştırma ayrı sonuç verir; nebula taraması aynı seed ile aynı yolu açar, zorunlu nadir drop yok; deep seferi enerji azlığında güvenli sonuçla döner. Aynı filo slotu iki kez başlatılamaz; rol bir görevdeyken başkasına atanamaz.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-cosmos.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Üç kozmos alt bölgesinin atlas/sahne/ambient ve 9 şablonunu tamamla. Filoyu ayrı ekonomik simülasyon olarak kurma: ortak expedition motorunu en fazla üç bağımsız snapshot ile çalıştır. Galaxies açılana kadar ana sefer tek kalır. Motor en çok dört eşzamanlı expedition nesnesi taşır.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Üç alt bölgede farklı oynanış doğrulanır; filo ön koşulları ve kaynak izolasyonu testleri PASS.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 11: 100.000 ışık yılı sonrası merak ve hikâye

**Files:** Modify: content.js, views.js, world-scenes.js, audio.js, beş dil sözlüğü. Create: tests/v2-frontier.js; docs/v2/story-map.md.

**Interfaces:** Produces: rim→void→galaxies→fracture→frontier görev grafiği; bölge başına 3 şablon, 3 ipucu; ipucu defterinde kaynak/çözülen soru/sonraki soru.

- [ ] **Step 1 — Başarısız test:** Far oyuncusu başlangıç görevlerini tekrar etmeden rim oynar. Mesafesi 1e30 olan kayıt son hikâyeyi otomatik tamamlamaz. İpuçları bir kez verilir ve sıralı okunabilir. Fracture bölgesinde ham hızdan farklı hazırlık kazandırır. Frontier bir soruyu gerçekten çözer, yeni erişilebilir hedef bırakır.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-frontier.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Sinyalin kaynağını eski bir geçit ağı olarak somutlaştır; void rölelerini bul, galaxies ağını bağla, fracture bozuk geçidi onar, frontier ilk yeni sistemi aç. İlk bölüm burada tamamlanır; devam merakı oynanabilir farklı atlas hatlarından gelir. Kaynağı bilinmeyen sinyalin cevabını girişte ifşa etme. Her aşamaya farklı kompozisyon, etkileşim ve ses yaz; yalnızca palet değişimi kabul edilmez.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Beş aşama uçtan uca oynanır; 15 şablon, en az 15 özgün ipucu ve aralarında çalışan açılışlar vardır. Bütün ekranlarda mobil/klavye kabulü PASS.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 12: Denge, sayısal sınırlar ve performans

**Files:** Create: tests/v2-balance.js; tests/v2-perf.js; docs/v2/balance.md. Modify: data.js, v2/content.js, src/worker.js yalnızca ölçüm gerektirirse; tests/sim_game.js.

**Interfaces:** Consumes: tüm saf motor API’leri. Produces: aktif/pasif/yeni/orta/far profilleri için makine okunur tempo ve ödül sonuçları; Worker eğrisi karşılaştırması.

- [ ] **Step 1 — Başarısız test:** İlk karar 5–10 dk, normal sefer 10–20 dk ve uzun sefer 30–60 dk hedeflerini simüle et; yeni ve far profilde açılış tıkanmaz. Kamp zorunlu maliyetleri tek seferlik araştırma havuzunu aşmaz. 1e30 mesafe, yüksek seviyeler ve bütün bonuslarda sonuçlar sonlu; sefer puanı ana krediyle kontrolsüz döngü oluşturmaz.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-balance.js; node tests/v2-perf.js` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Simülasyon sonuçlarına göre bütçeleri ayarla, kabul edilen sapmaları gerekçeyle kaydet. Referans makine/tarayıcıyı raporla; 390 px sahnede 60 sn örneklem, hedef p95 frame<33 ms; 10 dünya geçişinden sonra event listener/canvas birikimi yok. Profil başarısızsa parçacık/dekor bütçesini azalt. Yeni hız üst zarfını mevcut Worker REACH ile karşılaştır; yalnızca gerekiyorsa güncelle ve forge testini çalıştır.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Ölçüm raporu var; hedef dışı tempo/perf açıklamasız bırakılmaz. Worker dürüst v2 oyuncusunu kırpmaz ve sahte mesafe sınırı kaldırılmaz.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

### Task 13: Tam kabul, güvenli yayın ve v2 duyurusu

**Files:** Create: tests/v2-acceptance.js; docs/v2/release-checklist.md. Modify: tests/run-all.sh, tests/run-online.sh, tests/README.md, README.md, changelog.js.

**Interfaces:** Produces: 2.0.0 sürüm adayı, doğrulanmış dosya paketi ve beş dilde dürüst sürüm notları. Uygulama/yayın ayrı eylemlerdir; bu plan dağıtım yapmaz.

- [ ] **Step 1 — Başarısız test:** Yeni oyuncu ve far fixture ile tam döngü; bütün bölgelerde üç şablon ve iki yol ayrımı; mevcut koleksiyon ve online kimlik korunur. Tam eski regresyon, yeni assert testleri, beş dil ve görsel kabul. Eski HTML/yeni JS ve tersi karışımında kayıt ezilmez; v4 kaydı v3 sürüme sessiz düşürülmez.
- [ ] **Step 2 — Kırmızı doğrulama:** `node tests/v2-acceptance.js; node tests/keys.js; bash tests/run-all.sh; bash tests/run-online.sh` komutlarını ayrı ayrı çalıştır; yeni davranış eksik olduğu için assertion/API hatası bekle. Ortam/eksik tarayıcı hatasını kırmızı davranış kanıtı sayma. Tarayıcı testleri test sunucusu açıkken çalışır.
- [ ] **Step 3 — Uygulama:** Çalıştırıcılara bütün v2 testlerini ekle; Node saf testleri ayrıca çalıştır. Eksik çeviri/yer tutucu farklarını düzelt ve tests/keys.js gerçekten sıfır çıksın. Worker önizlemesinde asset/cache sürüm tutarlılığını doğrula. Mevcut auto-update eski sekmenin v4 göçünde döngüye girmesin. V3 uygulamaya kör rollback yapma: v4 okuyabilen uyumluluk sürümü veya korunmuş yedekten kullanıcı kontrollü kurtarma gerekir. Son olarak VERSION=2.0.0 ve açıklamaları ekle; önizleme/kabul tamamlandıktan sonra canlı yayın ayrı yürütülür.
- [ ] **Step 4 — Yeşil doğrulama:** Aynı komutları yeniden çalıştır. Beklenen: Hiçbir gizli/atlanmış hata PASS sayılmaz; sonuç raporunda çalıştırılan komutlar, görsel dosyalar ve kalan sınırlamalar açık. Tüm içerik oynanabilir olmadan 2.0 etiketi yayınlanmaz.
- [ ] **Step 5 — Kontrol ve checkpoint:** `git diff --check`; yalnız bu görevin dosyalarını gözden geçir ve açık kullanıcı değişikliklerini dahil etmeden bağımsız commit oluştur. Test sonucunu ilerleme kaydına ekle.

## Öz denetim ve planın sınırı

- Kayıt/ileri oyuncu: 2–4 ve 11; ana oyun döngüsü: 4–7; farklı ekranlar: 8–11; bütün dünya içerikleri: 3, 5, 8–11; kamp/uzmanlık: 7; çevrimdışı: 4, 9; merak hattı: 11; denge: 12; gerçek yayın kabulü: 13.
- İki sekme/ödül tekrarları 2/4/7; büyük sayılar 3/11/12; erişilebilirlik ve dil 6/8/9/11/13 tarafından kapsanır.
- Üretim kodu bu aşamada değiştirilmedi. Bu dokümanlar testlerin çalıştırıldığı anlamına gelmez.
- Takvim tahmini verilmedi: ilk dikey dilimin kabulü ve denge ölçümü görülmeden bütün v2 için tarih taahhüt edilmeyecek.
- Uygulamada bu sırayla çalışmak önerilir. İlk incelenebilir teslim, görev 8 sonunda çalışan yeryüzü–Bulut Adaları dilimidir; toplam v2 kapsamını daraltmaz.
