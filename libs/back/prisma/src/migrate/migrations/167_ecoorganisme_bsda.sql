ALTER TABLE "default$default"."EcoOrganisme"
    ADD COLUMN IF NOT EXISTS "handleBsda" BOOLEAN NOT NULL DEFAULT false;
