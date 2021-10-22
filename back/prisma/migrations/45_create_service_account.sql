-- Create new column
ALTER TABLE "default$default"."User"
ADD "isService" BOOLEAN NOT NULL DEFAULT FALSE;