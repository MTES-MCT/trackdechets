-- CreateTable
CREATE TABLE "Intermediary" (
    "id" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "vatNumber" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mail" TEXT NOT NULL,
    "formId" TEXT,

    CONSTRAINT "Intermediary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_IntermediaryFormIdIdx" ON "Intermediary"("formId");

-- AddForeignKey
ALTER TABLE "Intermediary" ADD CONSTRAINT "Intermediary_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;
