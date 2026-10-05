-- Gezginin son bildirdiği hızı (m/sn): iki bildirim arasında mesafesi tahmin edilir, etiketler canlı akar
ALTER TABLE players ADD COLUMN spd REAL NOT NULL DEFAULT 0;
