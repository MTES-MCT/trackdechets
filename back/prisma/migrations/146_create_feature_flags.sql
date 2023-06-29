CREATE TABLE IF NOT EXISTS "default$default"."FeatureFlag" (
  "id" VARCHAR(30) NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" VARCHAR(30) NOT NULL,
  CONSTRAINT "FeatureFlag_name_userId_unique_together" UNIQUE ("name", "userId"),
  FOREIGN KEY ("userId") REFERENCES "default$default"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
