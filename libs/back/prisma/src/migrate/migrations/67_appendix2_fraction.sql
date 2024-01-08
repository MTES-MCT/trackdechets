-- CreateTable
CREATE TABLE "default$default"."FormGroupement" (
    "id" TEXT NOT NULL,
    "nextFormId" TEXT NOT NULL,
    "initialFormId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FormGroupement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FormGroupement_pkey_unique_together" UNIQUE ("nextFormId", "initialFormId")
);

-- CreateIndex
CREATE INDEX "_FormGroupementNextFormId" ON "default$default"."FormGroupement"("nextFormId");

-- CreateIndex
CREATE INDEX "_FormGroupementInitialFormId" ON "default$default"."FormGroupement"("initialFormId");

-- AddForeignKey
ALTER TABLE "default$default"."FormGroupement" ADD CONSTRAINT "FormGroupement_nextFormId_fkey" FOREIGN KEY ("nextFormId") REFERENCES "default$default"."Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."FormGroupement" ADD CONSTRAINT "FormGroupement_initialFormId_fkey" FOREIGN KEY ("initialFormId") REFERENCES "default$default"."Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "default$default"."Form" ADD COLUMN "quantityGrouped" DOUBLE PRECISION NOT NULL DEFAULT 0;