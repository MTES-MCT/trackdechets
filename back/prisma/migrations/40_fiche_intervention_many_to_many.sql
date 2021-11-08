-- DropForeignKey
ALTER TABLE "default$default"."BsffFicheIntervention" DROP CONSTRAINT "BsffFicheIntervention_bsffId_fkey";

-- CreateTable
CREATE TABLE "default$default"."_BsffToBsffFicheIntervention" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BsffToBsffFicheIntervention_AB_unique" ON "default$default"."_BsffToBsffFicheIntervention"("A", "B");

-- CreateIndex
CREATE INDEX "_BsffToBsffFicheIntervention_B_index" ON "default$default"."_BsffToBsffFicheIntervention"("B");

-- AddForeignKey
ALTER TABLE "default$default"."_BsffToBsffFicheIntervention" ADD FOREIGN KEY ("A") REFERENCES "default$default"."Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."_BsffToBsffFicheIntervention" ADD FOREIGN KEY ("B") REFERENCES "default$default"."BsffFicheIntervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
