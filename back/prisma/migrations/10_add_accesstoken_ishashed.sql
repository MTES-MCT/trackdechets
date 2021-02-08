-- Add new column to tell apart hashed tokens and from clear ones

ALTER TABLE "default$default"."AccessToken" ADD COLUMN IF NOT EXISTS "isHashed" BOOLEAN DEFAULT FALSE;