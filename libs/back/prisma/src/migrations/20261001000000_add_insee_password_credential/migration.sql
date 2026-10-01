-- CreateTable: InseePasswordCredential
CREATE TABLE "InseePasswordCredential" (
  "key"               TEXT NOT NULL,
  "encryptedPassword" TEXT NOT NULL,
  "passwordChangedAt" TIMESTAMPTZ(6) NOT NULL,
  "updatedAt"         TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "InseePasswordCredential_pkey" PRIMARY KEY ("key")
);
