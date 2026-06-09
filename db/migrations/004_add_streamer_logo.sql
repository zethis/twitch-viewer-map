ALTER TABLE streamers ADD COLUMN IF NOT EXISTS logo_url VARCHAR(1024);
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS twitch_url VARCHAR(1024);

UPDATE streamers SET twitch_url = 'https://www.twitch.tv/JawedCS' WHERE name = 'JawedCS' AND twitch_url IS NULL;
