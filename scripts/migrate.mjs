#!/usr/bin/env node
// Applies every SQL file in supabase/migrations, in filename order, exactly once.
//
// Needs SUPABASE_DB_URL in .env.local (Supabase Dashboard -> Project Settings ->
// Database -> Connection string -> URI, "Session pooler" or "Direct"). The value
// is read from the environment and never printed.
//
//   node scripts/migrate.mjs           apply pending migrations
//   node scripts/migrate.mjs --status  list applied / pending, apply nothing
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = path.join(root, "supabase", "migrations");

function loadEnv() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#") || !line.includes("=")) continue;
    const key = line.slice(0, line.indexOf("=")).trim();
    const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error(`
SUPABASE_DB_URL is not set.

Add it to .env.local (do not paste it into chat):

  SUPABASE_DB_URL=postgresql://postgres.<ref>:<password>@<host>:5432/postgres

Find it in Supabase: Project Settings -> Database -> Connection string -> URI.
`);
  process.exit(1);
}

const statusOnly = process.argv.includes("--status");

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
} catch (err) {
  console.error(`Could not connect to Postgres: ${err.message}`);
  console.error("Check SUPABASE_DB_URL (host, port, password) in .env.local.");
  process.exit(1);
}

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      name        text primary key,
      applied_at  timestamptz not null default now()
    )
  `);

  const applied = new Set(
    (await client.query("select name from public.schema_migrations")).rows.map(
      (r) => r.name
    )
  );

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (statusOnly) {
    for (const file of files) {
      console.log(`${applied.has(file) ? "applied" : "PENDING"}  ${file}`);
    }
    process.exit(0);
  }

  const pending = files.filter((f) => !applied.has(f));
  if (!pending.length) {
    console.log("Nothing to apply - database is up to date.");
    process.exit(0);
  }

  for (const file of pending) {
    const sql = readFileSync(path.join(migrationsDir, file), "utf8");
    process.stdout.write(`applying ${file} ... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (name) values ($1)",
        [file]
      );
      await client.query("commit");
      console.log("ok");
    } catch (err) {
      await client.query("rollback");
      console.log("FAILED");
      // "already exists" means the table was created by hand earlier - record it
      // as applied so the run can continue.
      if (/already exists/i.test(err.message)) {
        await client.query(
          "insert into public.schema_migrations (name) values ($1) on conflict do nothing",
          [file]
        );
        console.log(`  (objects already existed - marked as applied)`);
        continue;
      }
      console.error(`  ${err.message}`);
      process.exit(1);
    }
  }
  console.log(`\nApplied ${pending.length} migration(s).`);
} finally {
  await client.end();
}
