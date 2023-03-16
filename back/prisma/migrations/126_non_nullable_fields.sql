-- User name
ALTER TABLE "default$default"."User" ALTER COLUMN "name" SET NOT NULL;

-- Company name
ALTER TABLE "default$default"."Company" ALTER COLUMN "name" SET NOT NULL;
