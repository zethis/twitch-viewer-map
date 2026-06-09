CREATE TABLE IF NOT EXISTS streamers (
  name VARCHAR(63) PRIMARY KEY,
  admin_password VARCHAR(255) NOT NULL DEFAULT '',
  display_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT streamers_name_check CHECK (name ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT streamers_name_reserved CHECK (name NOT IN ('api', '_next', 'admin', 'favicon.ico')),
  CONSTRAINT streamers_admin_password_check CHECK (admin_password <> '')
);

ALTER TABLE pins ADD COLUMN IF NOT EXISTS streamer_name VARCHAR(63);

UPDATE pins SET streamer_name = 'JawedCS' WHERE streamer_name IS NULL;

ALTER TABLE pins ALTER COLUMN streamer_name SET NOT NULL;

-- Seed default streamer before FK constraint (password updated at runtime)
INSERT INTO streamers (name, admin_password, display_name)
VALUES ('JawedCS', 'seed-placeholder', 'JawedCS')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE pins DROP CONSTRAINT IF EXISTS fk_pins_streamer;
ALTER TABLE pins ADD CONSTRAINT fk_pins_streamer FOREIGN KEY (streamer_name) REFERENCES streamers(name);
