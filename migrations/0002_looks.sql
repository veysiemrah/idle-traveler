-- Sahnede diğer gezginleri çizmek için: aracın görünüm aşaması, kıyafet ve yol arkadaşı
ALTER TABLE players ADD COLUMN tier INTEGER NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN outfit TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE players ADD COLUMN pal TEXT NOT NULL DEFAULT '';
