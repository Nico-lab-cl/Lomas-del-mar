-- Manual SQL for adding signing fields to the Lead table
ALTER TABLE "Lead" 
ADD COLUMN IF NOT EXISTS "signingStatus" TEXT,
ADD COLUMN IF NOT EXISTS "signingDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "signingProject" TEXT,
ADD COLUMN IF NOT EXISTS "signingLote" TEXT,
ADD COLUMN IF NOT EXISTS "signingEtapa" TEXT;
