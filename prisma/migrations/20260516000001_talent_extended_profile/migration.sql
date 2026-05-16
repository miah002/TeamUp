-- AlterTable: add new fields to users
ALTER TABLE "users" ADD COLUMN "alternativePhone" TEXT;
ALTER TABLE "users" ADD COLUMN "telegram" TEXT;
ALTER TABLE "users" ADD COLUMN "address" TEXT;
ALTER TABLE "users" ADD COLUMN "zip" TEXT;
ALTER TABLE "users" ADD COLUMN "photo" TEXT;
ALTER TABLE "users" ADD COLUMN "shiftWithOtherJob" TEXT;
ALTER TABLE "users" ADD COLUMN "datePaired" DATETIME;
ALTER TABLE "users" ADD COLUMN "tuOnboardingDate" DATETIME;
ALTER TABLE "users" ADD COLUMN "trainingClass" TEXT;
ALTER TABLE "users" ADD COLUMN "discProfile" TEXT;
ALTER TABLE "users" ADD COLUMN "axcAcademy" TEXT;

-- CreateTable: talent_emergency_contacts
CREATE TABLE "talent_emergency_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    CONSTRAINT "talent_emergency_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: talent_skills
CREATE TABLE "talent_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "talent_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "talent_skills_userId_skill_key" ON "talent_skills"("userId", "skill");

-- CreateTable: talent_equipment
CREATE TABLE "talent_equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "mainDevice" TEXT,
    "mainDeviceSpecs" TEXT,
    "backupDevice" TEXT,
    "backupDeviceSpecs" TEXT,
    "isp" TEXT,
    "backupPower" TEXT,
    CONSTRAINT "talent_equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: talent_documents
CREATE TABLE "talent_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "talent_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: talent_placements
CREATE TABLE "talent_placements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "opsNumber" INTEGER NOT NULL,
    "clientOnboardingDate" DATETIME,
    "bauDate" DATETIME,
    "disengagementDate" DATETIME,
    CONSTRAINT "talent_placements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "talent_placements_userId_opsNumber_key" ON "talent_placements"("userId", "opsNumber");
