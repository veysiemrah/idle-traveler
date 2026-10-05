-- Yolcular listesi: her oyuncunun adı, güncel yolculuk mesafesi ve kaçıncı yolculukta olduğu.
-- key: istemcinin gizli anahtarının SHA-256 özeti (başkası aynı kimlikle kaydı değiştiremesin)
CREATE TABLE IF NOT EXISTS players (
  id      TEXT PRIMARY KEY,
  key     TEXT NOT NULL,
  name    TEXT NOT NULL,
  dist    REAL NOT NULL DEFAULT 0,
  trip    INTEGER NOT NULL DEFAULT 1,
  veh     TEXT NOT NULL DEFAULT 'walk',
  route   TEXT NOT NULL DEFAULT 'anatolia',
  created INTEGER NOT NULL,
  seen    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS players_seen ON players (seen);
