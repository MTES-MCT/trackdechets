-- AlterTable
ALTER TABLE "_BsffToBsffFicheIntervention" ADD CONSTRAINT "_BsffToBsffFicheIntervention_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BsffToBsffFicheIntervention_AB_unique";
