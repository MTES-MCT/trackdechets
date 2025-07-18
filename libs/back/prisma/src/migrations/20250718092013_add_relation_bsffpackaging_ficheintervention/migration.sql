-- CreateTable
CREATE TABLE "_BsffFicheInterventionToBsffPackaging" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BsffFicheInterventionToBsffPackaging_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BsffFicheInterventionToBsffPackaging_B_index" ON "_BsffFicheInterventionToBsffPackaging"("B");

-- AddForeignKey
ALTER TABLE "_BsffFicheInterventionToBsffPackaging" ADD CONSTRAINT "_BsffFicheInterventionToBsffPackaging_A_fkey" FOREIGN KEY ("A") REFERENCES "BsffFicheIntervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BsffFicheInterventionToBsffPackaging" ADD CONSTRAINT "_BsffFicheInterventionToBsffPackaging_B_fkey" FOREIGN KEY ("B") REFERENCES "BsffPackaging"("id") ON DELETE CASCADE ON UPDATE CASCADE;
