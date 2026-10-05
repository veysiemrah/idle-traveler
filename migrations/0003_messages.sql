-- Hazır mesajlar: son gönderilen mesajın kimliği ve zamanı (metin istemcide, oyuncunun dilinde gösterilir)
ALTER TABLE players ADD COLUMN msg TEXT NOT NULL DEFAULT '';
ALTER TABLE players ADD COLUMN msgAt INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS players_msg ON players (msgAt);
