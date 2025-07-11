-- CreateTable
CREATE TABLE "BsffPackagingToBsffFicheIntervention" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "packagingId" VARCHAR(30) NOT NULL,
    "ficheInterventionId" VARCHAR(30) NOT NULL,

    CONSTRAINT "BsffPackagingToBsffFicheIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsffPackagingToBsffFicheInterventionPackagingIdIdx" ON "BsffPackagingToBsffFicheIntervention"("packagingId");

-- CreateIndex
CREATE INDEX "_BsffPackagingToBsffFicheInterventionFicheInterventionIdIdx" ON "BsffPackagingToBsffFicheIntervention"("ficheInterventionId");

-- CreateIndex
CREATE UNIQUE INDEX "BsffPackagingToBsffFicheIntervention_packagingId_ficheInter_key" ON "BsffPackagingToBsffFicheIntervention"("packagingId", "ficheInterventionId");

-- AddForeignKey
ALTER TABLE "BsffPackagingToBsffFicheIntervention" ADD CONSTRAINT "BsffPackagingToBsffFicheIntervention_bsffPackaging_fkey" FOREIGN KEY ("packagingId") REFERENCES "BsffPackaging"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackagingToBsffFicheIntervention" ADD CONSTRAINT "BsffPackagingToBsffFicheIntervention_bsffFicheIntervention_fkey" FOREIGN KEY ("ficheInterventionId") REFERENCES "BsffFicheIntervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
