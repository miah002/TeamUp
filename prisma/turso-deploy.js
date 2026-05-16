// @ts-nocheck
// Applies Prisma migration SQL files directly to Turso via the libsql client.
// Use this instead of `prisma migrate deploy` when targeting a remote Turso DB.
// Usage: node prisma/turso-deploy.js
require("dotenv/config");
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !url.startsWith("libsql://")) {
  console.error("DATABASE_URL must be a libsql:// URL. Check your .env file.");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function run() {
  const migrationsDir = path.join(__dirname, "migrations");
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  for (const folder of folders) {
    const sqlFile = path.join(migrationsDir, folder, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;

    const sql = fs.readFileSync(sqlFile, "utf8");
    const statements = sql
      .split(/;\s*\n/)
      .map((s) =>
        s
          .split("\n")
          .filter((line) => !line.trim().startsWith("--"))
          .join("\n")
          .trim()
      )
      .filter((s) => s.length > 0);

    console.log(`Applying: ${folder} (${statements.length} statements)`);
    for (const stmt of statements) {
      try {
        await client.execute(stmt.endsWith(";") ? stmt : stmt + ";");
      } catch (err) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate column name")
        ) {
          console.log(`  ⚠  skipped (already exists)`);
        } else {
          throw err;
        }
      }
    }
    console.log(`  ✓ done`);
  }

  console.log("\nAll migrations applied to Turso.");
  client.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
