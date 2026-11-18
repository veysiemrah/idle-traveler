# Başlangıç ve test düzeni

V2 çalışması mevcut `claude/vigilant-cerf-avqftv` dalındaki v1.67 araç değişiklikleri korunarak başladı. Önceden var olan `tests/package-lock.json` ve `debug.log` bu çalışmada temizlenmedi veya commit edilmedi.

Başlangıçta eski test koşucusu grep tabanlı log özeti üretiyordu. V2 için ayrı `v2-run.js` çocuk süreçlerin gerçek durum kodlarını toplar; başarısız assertion, sayfa hatası simülasyonu ve eksik dosya nonzero sonuçla doğrulandı. Tarayıcı testleri gerçek `pageerror` olaylarını ayrıca toplar ve assertion ile boş olduğunu kontrol eder.

Başlangıç sözlük denetimi es/fr `toast.badge` için `tierLow`/`tier` farkı bildirdi. Kod her iki değişkeni de sağladığı için bunlar dilbilgisel olarak kasıtlı iki biçimdi. Test, bu tek anahtarda açık aliası tanıyacak şekilde düzeltildi; çeviriler bozulmadı.

Tam regresyonun Atlas başlangıcından kaynaklanan eski fixture varsayımları ayrıştırıldı: klasik suite Yeryüzü/Garaj'da açılır, v2 suite gerçek Atlas başlangıcını kullanır. DOMContentLoaded zamanlamasına bağlı sahne yakalama yerine test ön yüklemesi gerçek sahne örneğini saklar. Test fault-injection route'ları sürümlenmiş JS query parametrelerini kapsar.

Sentetik v3 kayıtlar `tests/fixtures/v2/` altında. Bunlar gerçek kullanıcı verisi veya erişim anahtarı içermez. Testler saat değerlerini çalıştırma anında yeniler; gerçek kullanıcının üretim kaydı bu çalışmada okunmadı.
