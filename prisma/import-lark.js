/**
 * import-lark.js
 * Reads the Lark Base CSV export and upserts active talent accounts into Turso.
 *
 * Active = PAIRING column === "PAIRED"  AND  FINAL TENURITY COMBINED !== "DISENGAGED"
 *
 * Usage:
 *   node prisma/import-lark.js path/to/export.csv
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const bcrypt = require("bcryptjs");
const { createClient } = require("@libsql/client");

// ── Column indices (0-based) ────────────────────────────────────────────────
const COL = {
  NAME: 0,          // "Last, First" → reversed to "First Last"
  TELEGRAM: 1,      // TG handle
  PAIRING: 2,       // PAIRED = active
  OFFICE: 4,        // e.g. "ASC Cincinnati, OH"
  POST: 5,          // OPERATIONS | SCHEDULER | TU RECRUITER - SCHEDULER
  AVAILABILITY: 6,  // Full-time | Part-time | Project-based
  ROLES: 8,         // SA | RA/SA | DMS → maps to position
  PHONE: 9,         // CONTACT
  EMAIL: 13,        // email address
  START_DATE: 23,   // 1ST OPS BAU — first day on client
  COHORT: 29,       // TeamUp 001, TeamUp 002 …
  LARK_ID: 30,      // TU001, TU002 …
  BIRTHDATE: 32,    // birthdate
  FINAL_TENURITY: 91, // "DISENGAGED" = exclude
  CITY: 93,         // City (Lookup)
  REGION: 94,       // Region (Lookup)
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function reverseName(raw) {
  // "Last, First" → "First Last"
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const commaIdx = trimmed.indexOf(",");
  if (commaIdx === -1) return trimmed; // already "First Last" or single name
  const last = trimmed.slice(0, commaIdx).trim();
  const first = trimmed.slice(commaIdx + 1).trim();
  return first ? `${first} ${last}` : last;
}

function parseDate(raw) {
  if (!raw || !raw.trim()) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function col(row, idx) {
  return (row[idx] ?? "").trim();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node prisma/import-lark.js <path-to-csv>");
    process.exit(1);
  }

  const absPath = path.resolve(csvPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  const raw = fs.readFileSync(absPath, "utf-8");
  const rows = parse(raw, {
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  // First row is the header
  const [header, ...dataRows] = rows;
  console.log(`Total rows (excluding header): ${dataRows.length}`);

  // Filter: PAIRED and not DISENGAGED
  const active = dataRows.filter((row) => {
    const pairing = col(row, COL.PAIRING);
    const tenurity = col(row, COL.FINAL_TENURITY);
    return pairing === "PAIRED" && tenurity !== "DISENGAGED";
  });

  console.log(`Active talents to import: ${active.length}`);

  const DEFAULT_PASSWORD = await bcrypt.hash("talent1234", 10);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of active) {
    const email = col(row, COL.EMAIL).toLowerCase();
    const rawName = col(row, COL.NAME);

    if (!email || !email.includes("@")) {
      console.warn(`  SKIP (no valid email): ${rawName || "(unnamed)"}`);
      skipped++;
      continue;
    }

    const name = reverseName(rawName) || email.split("@")[0];
    const phone = col(row, COL.PHONE) || null;
    const position = col(row, COL.ROLES) || col(row, COL.POST) || null;
    const office = col(row, COL.OFFICE) || null;
    const availability = col(row, COL.AVAILABILITY) || null;
    const cohort = col(row, COL.COHORT) || null;
    const larkId = col(row, COL.LARK_ID) || null;
    const city = col(row, COL.CITY) || null;
    const region = col(row, COL.REGION) || null;
    const startDate = parseDate(col(row, COL.START_DATE));
    const birthdate = parseDate(col(row, COL.BIRTHDATE));
    const now = new Date().toISOString();

    try {
      // Upsert: insert or update on email conflict
      // Column names match Prisma's SQLite output (camelCase)
      await client.execute({
        sql: `
          INSERT INTO users (
            id, email, name, password, role, status,
            phone, position, office, availability, cohort,
            larkId, city, region, startDate, birthdate,
            createdAt, updatedAt
          ) VALUES (
            lower(hex(randomblob(9))), ?, ?, ?, 'TALENT', 'ACTIVE',
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?
          )
          ON CONFLICT(email) DO UPDATE SET
            name         = excluded.name,
            phone        = excluded.phone,
            position     = excluded.position,
            office       = excluded.office,
            availability = excluded.availability,
            cohort       = excluded.cohort,
            larkId       = excluded.larkId,
            city         = excluded.city,
            region       = excluded.region,
            startDate    = excluded.startDate,
            birthdate    = excluded.birthdate,
            updatedAt    = excluded.updatedAt
        `,
        args: [
          email, name, DEFAULT_PASSWORD,
          phone, position, office, availability, cohort,
          larkId, city, region,
          startDate, birthdate,
          now, now,
        ],
      });
      console.log(`  OK  ${email} — ${name}`);
      inserted++;
    } catch (err) {
      console.error(`  ERR ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. Inserted/updated: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
