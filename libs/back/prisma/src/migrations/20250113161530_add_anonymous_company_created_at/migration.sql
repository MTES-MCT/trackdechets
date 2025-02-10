-- First, add column
ALTER TABLE "AnonymousCompany" ADD COLUMN "createdAt" TIMESTAMP(3);

-- Once done, add default value to now() for all new rows
ALTER TABLE "AnonymousCompany" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;