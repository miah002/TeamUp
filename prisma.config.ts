import "dotenv/config";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
    adapter: () => new PrismaLibSql({ url: dbUrl }),
  },
});
