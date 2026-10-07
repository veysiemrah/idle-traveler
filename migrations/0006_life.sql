-- Bütün yolculuklarda gidilen toplam yol (m): Yolcular sekmesindeki "Tüm zamanlar" sıralaması.
-- Var olan kayıtlar o anki yolculuğun mesafesiyle başlar; değer güncellemede hiç azalmaz.
ALTER TABLE players ADD COLUMN life REAL NOT NULL DEFAULT 0;
UPDATE players SET life = dist WHERE life < dist;
CREATE INDEX IF NOT EXISTS players_life ON players (life DESC);
