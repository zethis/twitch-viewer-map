CREATE TABLE IF NOT EXISTS streamers (
  name VARCHAR(63) PRIMARY KEY,
  admin_password VARCHAR(255) NOT NULL DEFAULT '',
  display_name VARCHAR(255),
  logo_url VARCHAR(1024),
  twitch_url VARCHAR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT streamers_name_check CHECK (name ~ '^[a-zA-Z0-9_-]+$'),
  CONSTRAINT streamers_name_reserved CHECK (name NOT IN ('api', '_next', 'admin', 'favicon.ico')),
  CONSTRAINT streamers_admin_password_check CHECK (admin_password <> '')
);

CREATE TABLE IF NOT EXISTS pins (
  id           SERIAL PRIMARY KEY,
  city         VARCHAR(255) NOT NULL,
  username     VARCHAR(25),
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  twitch_id    VARCHAR(64),
  display_name VARCHAR(50),
  profile_image_url TEXT,
  streamer_name VARCHAR(63) NOT NULL CONSTRAINT fk_pins_streamer REFERENCES streamers(name),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
