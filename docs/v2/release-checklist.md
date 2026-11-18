# V2 yayın kontrolü

- [x] Derlemesiz uygulama, 12 dünya, 39 sefer ve 78 karar
- [x] İlk kez gelen oyuncuya Atlas girişi
- [x] 100.000 LY kayıt için doğrudan Rim girişi
- [x] Kamp, ekipman, roller, dört eşzamanlı sefer
- [x] Beş dilde içerik ve arayüz
- [x] Şema v4 göçü, ilk yedek, ayrı güncel kurtarma kopyası
- [x] Eski istemci, gelecekteki şema, bozuk JSON ve kota senaryoları
- [x] Seçim öncesi bekleme, düşük FPS ve saat geri alma regresyonları
- [x] Yerel çok oyunculu testler
- [x] 60 sn referans mobil viewport performans ölçümü
- [x] Sürüm notları ve sürümlenmiş statik varlık URL'leri
- [x] Tam klasik regresyon çıktısı incelendi. Birleştirilmiş rapordaki `tab.Retry` uyarısı, HTML boşluğu düzeltildikten sonraki ayrı dil koşusunda yeniden görülmedi.
- [ ] Gerçek kullanıcı kaydının **kopyasıyla** tarayıcı önizleme kabulü
- [ ] Gerçek telefon ve birkaç gün dönüş davranışıyla oyun testi
- [ ] Üretim yayını ve v2 duyurusu (bu çalışma kapsamında yürütülmedi)

Önceki v3 koduna kör rollback yapma. V4 kurtarma kopyasını okuyabilen uyumluluk sürümü gerekir. Eski istemci v3 ana anahtarı yazarsa güncel v4 kurtarma kopyası saklı kalır; yeni uygulama bu kaydı geri yükler.

Karma sürüm sınırı: v3 istemcisinde v4 kopyasından sonra kazanılan kredi/araçlar otomatik birleştirilmez. Geri dönüşte v4 keşif durumu korunur, eski istemcinin son v3 verisi ayrı arşivlenir. Yayından önce önbellekte açık eski sekmelerle bu davranış kullanıcıya açıklanmalı ve gerçek kayıt kopyasıyla doğrulanmalıdır.
