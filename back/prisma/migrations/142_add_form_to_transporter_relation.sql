-- AlterTable
ALTER TABLE
  "Form"
ADD
  COLUMN "transporter1Id" TEXT,
ADD
  COLUMN "transporter2Id" TEXT,
ADD
  COLUMN "transporter3Id" TEXT,
ADD
  COLUMN "transporter4Id" TEXT,
ADD
  COLUMN "transporter5Id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Form_transporter1Id_key" ON "Form"("transporter1Id");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transporter2Id_key" ON "Form"("transporter2Id");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transporter3Id_key" ON "Form"("transporter3Id");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transporter4Id_key" ON "Form"("transporter4Id");

-- CreateIndex
CREATE UNIQUE INDEX "Form_transporter5Id_key" ON "Form"("transporter5Id");

-- AddForeignKey
ALTER TABLE
  "Form"
ADD
  CONSTRAINT "Form_transporter1Id_fkey" FOREIGN KEY ("transporter1Id") REFERENCES "BsddTransporter"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "Form"
ADD
  CONSTRAINT "Form_transporter2Id_fkey" FOREIGN KEY ("transporter2Id") REFERENCES "BsddTransporter"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "Form"
ADD
  CONSTRAINT "Form_transporter3Id_fkey" FOREIGN KEY ("transporter3Id") REFERENCES "BsddTransporter"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "Form"
ADD
  CONSTRAINT "Form_transporter4Id_fkey" FOREIGN KEY ("transporter4Id") REFERENCES "BsddTransporter"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "Form"
ADD
  CONSTRAINT "Form_transporter5Id_fkey" FOREIGN KEY ("transporter5Id") REFERENCES "BsddTransporter"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;