-- El sallama: mesajın kime gönderildiği (alıcının pub anahtarı; herkese açık mesajlarda boş)
ALTER TABLE players ADD COLUMN msgTo TEXT NOT NULL DEFAULT '';
