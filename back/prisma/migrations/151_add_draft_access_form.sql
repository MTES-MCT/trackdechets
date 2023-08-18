ALTER TABLE "default$default"."Form" ADD COLUMN IF NOT EXISTS "canAccessDraftSirets" text[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS "_FormCanAccessDraftSiretsIdx" ON "default$default"."Form" USING GIN ("canAccessDraftSirets");
