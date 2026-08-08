-- AlterTable
-- Use a temporary empty-string default only so this required column can be added
-- for existing development rows. The default is immediately removed, and the
-- Stage 5B seed/backfill must populate real password hashes before accounts are used.
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP DEFAULT;
