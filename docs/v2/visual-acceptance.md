# Görsel kabul

`tests/v2-browser.js` 12 dünya için `tests/out/v2-<world>.png` (Atlas açık) ve `tests/out/v2-scene-<world>.png` (panel kapalı) üretir. Kapatma düğmesinin gerçekten `sheet-open` durumunu kaldırdığı ayrıca assertion ile doğrulanır.

İncelenen kompozisyonlar: Bulut Adaları, Fırtına Kuşağı, Yüksek Atmosfer, Gezegenler Sistemi, Nebula Denizi, Derin Uzay, Galaksiler Ağı ve Kırık Uzay. İlk tema token'ı hatası ve mobil başlıktaki pointer capture nedeniyle kapatılamayan panel düzeltildi; ilgili testler yeniden geçti.

Arayüz: 320 px beş dil/koyu tema; sahneler: 390×844, azaltılmış hareket. Klasik yerleşim suite'i ayrıca 768 px tablet ve yatay telefonu denetler. Gerçek telefon ve uzun kullanıcı denemesi hâlâ yayın kabulünün parçasıdır.
