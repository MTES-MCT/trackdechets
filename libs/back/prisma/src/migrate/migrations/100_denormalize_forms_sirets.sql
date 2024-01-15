ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "recipientsSirets" text[] DEFAULT '{}';
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "transportersSirets" text[] DEFAULT '{}';
ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "intermediariesSirets" text[] DEFAULT '{}';
