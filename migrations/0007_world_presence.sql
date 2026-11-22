ALTER TABLE players ADD COLUMN world TEXT NOT NULL DEFAULT 'earth';
CREATE INDEX players_world_seen ON players (world, seen DESC);
