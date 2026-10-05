# Idle Traveler – Claude talimatları

Tarayıcıda çalışan, derleme adımı olmayan bir idle oyun. Ayrıntılar ve dosya yapısı için `README.md` dosyasına bak.

## "Oyunu geliştir" komutu

Kullanıcı "oyunu geliştir" dediğinde işleri şu sırayla yap:

1. **Hataları düzelt.** Önce oyundaki hataları bul ve düzelt: konsol hataları, bozuk ya da yanlış çalışan
   mekanikler, kayıt/yükleme sorunları, arayüz ve sahne hataları.
2. **Mantık eksiklerini gider.** Oyun mantığındaki boşlukları ve tutarsızlıkları kapat: dengesiz ekonomi,
   ulaşılamayan ya da anlamsız ilerleme, eksik kontroller, hesaplanmayan durumlar, eski kayıtlarla uyumsuzluk.
3. **Yenilik ekle.** Ardından oyuna yeni özellikler, içerik ya da iyileştirmeler ekle. Hangi yeniliklerin
   ekleneceğini seçmekte tamamen özgürsün; kullanıcıya sormadan karar verip uygula. Yenilikler oyunun
   rahatlatıcı tonuna ve mevcut yapısına uymalı.

Her adımın sonunda neyin değiştiğini kısaca özetle. `README.md` dosyasını da yeni özelliklere göre güncelle.
Yayına çıkan her değişiklikte `public/js/changelog.js` içindeki `IT.VERSION` değerini artır ve `IT.CHANGELOG` dizisinin
başına o sürümün notlarını beş dilde (tr, en, de, es, fr) ekle; oyuncular bunları Yenilikler penceresinde görür.
