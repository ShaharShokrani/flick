export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL,
  image text,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  guest_code text UNIQUE
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  expires_at timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  issuer text,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamp,
  refresh_token_expires_at timestamp,
  scope text,
  password text,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "card" (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  example text NOT NULL DEFAULT '',
  known boolean NOT NULL DEFAULT false,
  created_at bigint NOT NULL,
  due_at bigint NOT NULL,
  interval_days integer NOT NULL,
  repetitions integer NOT NULL,
  ease double precision NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS card_user_word ON "card" (user_id, lower(word));

ALTER TABLE "account" ADD COLUMN IF NOT EXISTS issuer text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS guest_code text;
`;
