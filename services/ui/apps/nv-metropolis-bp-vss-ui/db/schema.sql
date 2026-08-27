-- Auth & organization layer — dedicated database schema.
--
-- Local dev reuses the existing `video_intelligence` database, which already
-- has these three tables. This file is the source of truth for the Phase 2
-- server deployment (a dedicated Postgres container).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE organization (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  contact_email text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_user (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  role          text NOT NULL DEFAULT 'owner'
                CHECK (role IN ('owner','admin','member','viewer')),
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','invited','disabled')),
  password_hash text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE otp_challenge (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose       text NOT NULL CHECK (purpose IN ('signup','reset')),
  email         text NOT NULL,
  otp_hash      text NOT NULL,
  org_name      text,
  name          text,
  password_hash text,
  user_id       uuid REFERENCES app_user(id) ON DELETE CASCADE,
  attempts      int NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, purpose)
);
