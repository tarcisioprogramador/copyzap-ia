#!/usr/bin/env node

import pg from "pg";

const SQL = `
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "plan" text NOT NULL DEFAULT 'free',
  "copies_used_today" integer NOT NULL DEFAULT 0,
  "copies_reset_at" timestamp NOT NULL DEFAULT now(),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "copies" (
  "id" SERIAL PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "client_name" text NOT NULL,
  "product" text NOT NULL,
  "value" text,
  "context" text,
  "message_type" text NOT NULL,
  "tone" text NOT NULL DEFAULT 'profissional',
  "generated_text" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" SERIAL PRIMARY KEY,
  "title" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" SERIAL PRIMARY KEY,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
`;

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(SQL);
  console.log("[db:init] Tables created/updated successfully");
} catch (err) {
  console.error("[db:init] Error:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
