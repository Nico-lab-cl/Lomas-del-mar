-- Update Lead table with new fields for synchronization
-- Run this in your Easypanel / Postgres console

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmSource" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmMedium" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmContent" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "utmTerm" TEXT;

-- For deduplication to work, email must be unique
-- Note: Check if there are duplicate emails before running this.
-- If you get an error, you must delete duplicates first.
-- CREATE UNIQUE INDEX IF NOT EXISTS "Lead_email_key" ON "Lead"("email");
