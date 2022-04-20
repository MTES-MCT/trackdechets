-- CreateTable
CREATE TABLE "FormGroupement" (
    "id" TEXT NOT NULL,
    "nextFormId" TEXT NOT NULL,
    "initialFormId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FormGroupement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_FormGroupementNextFormId" ON "FormGroupement"("nextFormId");

-- CreateIndex
CREATE INDEX "_FormGroupementInitialFormId" ON "FormGroupement"("initialFormId");

-- AddForeignKey
ALTER TABLE "FormGroupement" ADD CONSTRAINT "FormGroupement_nextFormId_fkey" FOREIGN KEY ("nextFormId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormGroupement" ADD CONSTRAINT "FormGroupement_initialFormId_fkey" FOREIGN KEY ("initialFormId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate data
INSERT INTO "default$default"."FormGroupement" ("initialFormId", "nextFormId", "quantity")
SELECT "id", "appendix2RootFormId", "quantityReceived" FROM "default$default"."Form" WHERE "appendix2RootFormId" IS NOT NULL;


-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_appendix2RootFormId_fkey";

-- DropIndex
DROP INDEX "_FormAppendix2RootFormIdIdx";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "appendix2RootFormId";


