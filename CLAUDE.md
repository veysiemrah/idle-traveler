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

Yenilik seçerken şu ilkeleri gözet (hepsini tek seferde uygulamak gerekmez, turlara yay):
- Her yenilik oyuncunun merakını çeksin, oyunu oynama isteği uyandırsın (gizem, sürpriz, bir sonraki hedefi merak ettirme).
- Araç yükseltmeleri araç üzerinde görsel değişiklik yapsın (seviye arttıkça araç görünür biçimde gelişsin).
- Eve dönüşle başlayan her yeni yolculuk yeni bir seyahat rotası açsın.

Her değişiklikte tasarımın harika hissettirmesi için ayrıntıları önemse:
- Görseller açık/koyu temada, gece ve gündüzde, telefonda (320 piksele kadar) ve geniş ekranda düzgün görünsün; ekran görüntüsüyle kontrol et.
- Hareketler yumuşak olsun (belirme, kaybolma, geçişler); hiçbir şey birden zıplamasın, kaymasın ya da üst üste binmesin.
- Metinler beş dilde doğal ve tutarlı olsun; uzun ad ve çeviriler taşmasın.
- Boş, yükleniyor ve hata durumları da özenli görünsün; dokunulan her şey ses, ışık ya da küçük bir hareketle karşılık versin.

Her adımın sonunda neyin değiştiğini kısaca özetle. `README.md` dosyasını da yeni özelliklere göre güncelle.
Yayına çıkan her değişiklikte `public/js/changelog.js` içindeki `IT.VERSION` değerini artır ve `IT.CHANGELOG` dizisinin
başına o sürümün notlarını beş dilde (tr, en, de, es, fr) ekle; oyuncular bunları Yenilikler penceresinde görür.

Sürüm notlarını yazarken:
- Hata düzeltmelerini açıkça yazma ("X bozuktu, düzeldi" gibi). Gerekirse yalnızca "küçük rötuşlar" gibi genel bir satırla geç.
- Merak uyandırması gereken yenilikleri (gizli ödüller, sürprizler, açılan görünümler, yeni yol arkadaşları gibi) ayrıntısıyla
  anlatma; ne olduğunu ve nasıl açıldığını söylemeden yalnızca ipucu ver ve oyuncunun kendisi keşfetmesine bırak.
