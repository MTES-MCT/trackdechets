ALTER TABLE
    "default$default"."Application"
ADD COLUMN
    "openIdEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE
    "default$default"."Grant"
ADD COLUMN
    "openIdEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN
    "scope" text[] DEFAULT '{}';