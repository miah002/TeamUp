/**
 * import-lark.js
 * Reads the Lark Base CSV export and upserts all talent records into Turso.
 *
 * Active   = PAIRING === "PAIRED"  AND  FINAL TENURITY !== "DISENGAGED"
 *            → status ACTIVE, password talent1234 (can log in)
 *
 * Inactive = FINAL TENURITY === "DISENGAGED" → status RESIGNED
 *            everything else                 → status INACTIVE
 *            → random unguessable password (record exists, cannot log in)
 *
 * Usage:
 *   node prisma/import-lark.js "path/to/export.csv"
 */

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
const bcrypt = require("bcryptjs");
const { createClient } = require("@libsql/client");

// ── Column indices (0-based) ─────────────────────────────────────────────────
const C = {
  NAME: 0,
  TELEGRAM: 1,
  PAIRING: 2,
  TENURE_M: 3,
  OFFICE: 4,
  POST: 5,
  AVAILABILITY: 6,
  SHIFT_OTHER: 7,
  ROLES: 8,
  PHONE: 9,
  ALTERNATIVE: 10,
  EMERGENCY_NAME: 11,
  EMERGENCY_PHONE: 12,
  EMAIL: 13,
  ADDRESS: 14,
  ZIP: 15,
  PITCH_VIDEO: 17,
  RESUME: 18,
  TU_ONBOARDING: 19,
  TU_TRAINING: 20,
  CLIENT_ONBOARDING: 22,
  OPS1_BAU: 23,
  OPS2_BAU: 24,
  OPS1_DISENGAGE: 25,
  OPS2_DISENGAGE: 26,
  PHOTO: 27,
  TRAINING_CLASS: 28,
  COHORT: 29,
  LARK_ID: 30,
  AXC_ACADEMY: 31,
  BIRTHDATE: 32,
  SKILL_REAL_ESTATE: 33,
  SKILL_PNC: 34,
  SKILL_HEALTHCARE: 35,
  SKILL_ECOMMERCE: 36,
  SKILL_RECRUITMENT: 37,
  SKILL_GENERAL_VA: 38,
  SKILL_SALES: 39,
  SKILL_GRAPHIC: 40,
  SKILL_SMM: 41,
  SKILL_FINANCIAL: 42,
  SKILL_OTHER: 43,
  DISC_FILE: 44,
  INTRO_VIDEO: 45,
  OG_RESUME_FILE: 46,
  DISC: 47,
  APP_LINK: 48,
  OG_RESUME_LINK: 49,
  INTERVIEW: 50,
  PRAC_PROD: 51,
  TESTIMONIAL: 52,
  MAIN_DEVICE_SPECS: 56,
  BU_DEVICE_SPECS: 57,
  MAIN_DEVICE: 59,
  BU_DEVICE: 60,
  ISP: 61,
  BU_POWER: 62,
  DATE_PAIRED: 74,
  FINAL_TENURITY: 91,
  CITY: 93,
  REGION: 94,
};

// ── Skill column definitions ─────────────────────────────────────────────────
const SKILL_COLS = [
  { col: C.SKILL_REAL_ESTATE, name: "Real Estate" },
  { col: C.SKILL_PNC, name: "P&C / Life Insurance" },
  { col: C.SKILL_HEALTHCARE, name: "Healthcare" },
  { col: C.SKILL_ECOMMERCE, name: "E-commerce VA" },
  { col: C.SKILL_RECRUITMENT, name: "Recruitment VA" },
  { col: C.SKILL_GENERAL_VA, name: "General VA" },
  { col: C.SKILL_SALES, name: "Sales" },
  { col: C.SKILL_GRAPHIC, name: "Graphic Design / Video Editing" },
  { col: C.SKILL_SMM, name: "SMM" },
  { col: C.SKILL_FINANCIAL, name: "Financial" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function col(row, idx) {
  return (row[idx] ?? "").trim();
}

function reverseName(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const comma = trimmed.indexOf(",");
  if (comma === -1) return trimmed;
  const last = trimmed.slice(0, comma).trim();
  const first = trimmed.slice(comma + 1).trim();
  return first ? `${first} ${last}` : last;
}

function parseDate(raw) {
  if (!raw || !raw.trim()) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function isUrl(val) {
  return val && (val.startsWith("http://") || val.startsWith("https://") || val.startsWith("drive.google"));
}

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
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
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const client = createClient({ url, authToken });
  const raw = fs.readFileSync(absPath, "utf-8");

  const rows = parse(raw, {
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const [, ...dataRows] = rows;
  console.log(`Total rows (excluding header): ${dataRows.length}`);

  const toImport = dataRows.filter((row) => col(row, C.NAME).trim() !== "");
  const activeCount = toImport.filter(
    (r) => col(r, C.PAIRING) === "PAIRED" && col(r, C.FINAL_TENURITY) !== "DISENGAGED"
  ).length;
  console.log(`Active (can log in): ${activeCount}`);
  console.log(`Inactive (record only): ${toImport.length - activeCount}\n`);

  const ACTIVE_PASSWORD = await bcrypt.hash("talent1234", 10);
  const now = new Date().toISOString();

  let ok = 0, skipped = 0, errors = 0;

  for (const row of toImport) {
    const email = col(row, C.EMAIL).toLowerCase();
    const rawName = col(row, C.NAME);

    if (!email || !email.includes("@")) {
      console.warn(`  SKIP (no email): ${rawName || "(unnamed)"}`);
      skipped++;
      continue;
    }

    const name = reverseName(rawName) || email.split("@")[0];

    const isActive = col(row, C.PAIRING) === "PAIRED" && col(row, C.FINAL_TENURITY) !== "DISENGAGED";
    const isDisengaged = col(row, C.FINAL_TENURITY) === "DISENGAGED";
    const status = isActive ? "ACTIVE" : isDisengaged ? "RESIGNED" : "INACTIVE";
    // Inactive users get a random unguessable password so they cannot log in
    const password = isActive
      ? ACTIVE_PASSWORD
      : await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

    try {
      // ── Upsert user ────────────────────────────────────────────────────
      await client.execute({
        sql: `
          INSERT INTO users (
            id, email, name, password, role, status,
            phone, alternativePhone, telegram,
            birthdate, address, zip, city, region,
            photo, bio,
            position, department, office, availability, shiftWithOtherJob,
            startDate, datePaired, tuOnboardingDate,
            larkId, cohort, trainingClass, discProfile, axcAcademy,
            createdAt, updatedAt
          ) VALUES (
            ?, ?, ?, ?, 'TALENT', ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, NULL,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?
          )
          ON CONFLICT(email) DO UPDATE SET
            name             = excluded.name,
            phone            = excluded.phone,
            alternativePhone = excluded.alternativePhone,
            telegram         = excluded.telegram,
            birthdate        = excluded.birthdate,
            address          = excluded.address,
            zip              = excluded.zip,
            city             = excluded.city,
            region           = excluded.region,
            photo            = excluded.photo,
            position         = excluded.position,
            department       = excluded.department,
            office           = excluded.office,
            availability     = excluded.availability,
            shiftWithOtherJob = excluded.shiftWithOtherJob,
            startDate        = excluded.startDate,
            datePaired       = excluded.datePaired,
            tuOnboardingDate = excluded.tuOnboardingDate,
            larkId           = excluded.larkId,
            cohort           = excluded.cohort,
            trainingClass    = excluded.trainingClass,
            discProfile      = excluded.discProfile,
            axcAcademy       = excluded.axcAcademy,
            updatedAt        = excluded.updatedAt
        `,
        args: [
          cuid(), email, name, password, status,
          col(row, C.PHONE) || null,
          col(row, C.ALTERNATIVE) || null,
          col(row, C.TELEGRAM) || null,
          parseDate(col(row, C.BIRTHDATE)),
          col(row, C.ADDRESS) || null,
          col(row, C.ZIP) || null,
          col(row, C.CITY) || null,
          col(row, C.REGION) || null,
          col(row, C.PHOTO) || null,
          col(row, C.ROLES) || col(row, C.POST) || null,
          col(row, C.POST) || null,
          col(row, C.OFFICE) || null,
          col(row, C.AVAILABILITY) || null,
          col(row, C.SHIFT_OTHER) || null,
          parseDate(col(row, C.OPS1_BAU)),
          parseDate(col(row, C.DATE_PAIRED)),
          parseDate(col(row, C.TU_ONBOARDING)),
          col(row, C.LARK_ID) || null,
          col(row, C.COHORT) || null,
          col(row, C.TRAINING_CLASS) || null,
          col(row, C.DISC) || null,
          col(row, C.AXC_ACADEMY) || null,
          now, now,
        ],
      });

      // Get the user id for related records
      const result = await client.execute({
        sql: `SELECT id FROM users WHERE email = ?`,
        args: [email],
      });
      const userId = result.rows[0]?.id;
      if (!userId) throw new Error("Could not find user after upsert");

      // ── Emergency contact ──────────────────────────────────────────────
      const ecName = col(row, C.EMERGENCY_NAME);
      const ecPhone = col(row, C.EMERGENCY_PHONE);
      if (ecName && ecPhone) {
        await client.execute({
          sql: `
            INSERT INTO talent_emergency_contacts (id, userId, name, phone)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET name = excluded.name, phone = excluded.phone
          `,
          args: [cuid(), userId, ecName, ecPhone],
        });
      }

      // ── Skills ─────────────────────────────────────────────────────────
      for (const { col: colIdx, name: skillName } of SKILL_COLS) {
        const val = col(row, colIdx);
        if (!val || val === "NA" || val === "N/A" || val === "0") continue;
        const notes = val === "YES" || val === "1" ? null : val;
        await client.execute({
          sql: `
            INSERT INTO talent_skills (id, userId, skill, notes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(userId, skill) DO UPDATE SET notes = excluded.notes
          `,
          args: [cuid(), userId, skillName, notes],
        });
      }
      // Other skills (free text)
      const otherSkill = col(row, C.SKILL_OTHER);
      if (otherSkill && otherSkill !== "NA" && otherSkill !== "N/A") {
        await client.execute({
          sql: `
            INSERT INTO talent_skills (id, userId, skill, notes)
            VALUES (?, ?, 'Other', ?)
            ON CONFLICT(userId, skill) DO UPDATE SET notes = excluded.notes
          `,
          args: [cuid(), userId, otherSkill],
        });
      }

      // ── Equipment ──────────────────────────────────────────────────────
      const mainDev = col(row, C.MAIN_DEVICE) || col(row, C.MAIN_DEVICE_SPECS) || null;
      const buDev = col(row, C.BU_DEVICE) || col(row, C.BU_DEVICE_SPECS) || null;
      if (mainDev || buDev || col(row, C.ISP)) {
        await client.execute({
          sql: `
            INSERT INTO talent_equipment (id, userId, mainDevice, mainDeviceSpecs, backupDevice, backupDeviceSpecs, isp, backupPower)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET
              mainDevice = excluded.mainDevice,
              mainDeviceSpecs = excluded.mainDeviceSpecs,
              backupDevice = excluded.backupDevice,
              backupDeviceSpecs = excluded.backupDeviceSpecs,
              isp = excluded.isp,
              backupPower = excluded.backupPower
          `,
          args: [
            cuid(), userId,
            col(row, C.MAIN_DEVICE) || null,
            col(row, C.MAIN_DEVICE_SPECS) || null,
            col(row, C.BU_DEVICE) || null,
            col(row, C.BU_DEVICE_SPECS) || null,
            col(row, C.ISP) || null,
            col(row, C.BU_POWER) || null,
          ],
        });
      }

      // ── Documents ──────────────────────────────────────────────────────
      const docs = [
        { type: "RESUME", col: C.RESUME },
        { type: "PITCH_VIDEO", col: C.PITCH_VIDEO },
        { type: "INTRO_VIDEO", col: C.INTRO_VIDEO },
        { type: "OG_RESUME", col: C.OG_RESUME_FILE },
        { type: "APPLICATION", col: C.APP_LINK },
        { type: "OG_APPLICATION", col: C.OG_RESUME_LINK },
        { type: "INTERVIEW", col: C.INTERVIEW },
        { type: "PRAC_PROD", col: C.PRAC_PROD },
        { type: "TESTIMONIAL", col: C.TESTIMONIAL },
        { type: "DISC_FILE", col: C.DISC_FILE },
      ];
      for (const doc of docs) {
        const val = col(row, doc.col);
        if (!isUrl(val)) continue;
        await client.execute({
          sql: `
            INSERT INTO talent_documents (id, userId, type, url, label, createdAt)
            VALUES (?, ?, ?, ?, NULL, ?)
            ON CONFLICT DO NOTHING
          `,
          args: [cuid(), userId, doc.type, val, now],
        });
      }

      // ── Client placements ──────────────────────────────────────────────
      const ops1Bau = parseDate(col(row, C.OPS1_BAU));
      if (ops1Bau) {
        await client.execute({
          sql: `
            INSERT INTO talent_placements (id, userId, opsNumber, clientOnboardingDate, bauDate, disengagementDate)
            VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(userId, opsNumber) DO UPDATE SET
              clientOnboardingDate = excluded.clientOnboardingDate,
              bauDate = excluded.bauDate,
              disengagementDate = excluded.disengagementDate
          `,
          args: [
            cuid(), userId,
            parseDate(col(row, C.CLIENT_ONBOARDING)),
            ops1Bau,
            parseDate(col(row, C.OPS1_DISENGAGE)),
          ],
        });
      }
      const ops2Bau = parseDate(col(row, C.OPS2_BAU));
      if (ops2Bau) {
        await client.execute({
          sql: `
            INSERT INTO talent_placements (id, userId, opsNumber, clientOnboardingDate, bauDate, disengagementDate)
            VALUES (?, ?, 2, NULL, ?, ?)
            ON CONFLICT(userId, opsNumber) DO UPDATE SET
              bauDate = excluded.bauDate,
              disengagementDate = excluded.disengagementDate
          `,
          args: [cuid(), userId, ops2Bau, parseDate(col(row, C.OPS2_DISENGAGE))],
        });
      }

      console.log(`  OK  [${isActive ? "ACTIVE" : status}] ${email} — ${name}`);
      ok++;
    } catch (err) {
      console.error(`  ERR ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone. OK: ${ok}, Skipped: ${skipped}, Errors: ${errors}`);
  client.close();
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
