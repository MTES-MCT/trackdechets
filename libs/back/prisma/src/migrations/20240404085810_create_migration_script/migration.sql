-- CreateTable
CREATE TABLE "MigrationScript" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(6),
    "error" TEXT,

    CONSTRAINT "MigrationScript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MigrationScript_name_key" ON "MigrationScript"("name");
