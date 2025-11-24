-- CreateIndex
CREATE INDEX IF NOT EXISTS "_BsdasriTraderCompanySiretIdx" ON "Bsdasri"("traderCompanySiret");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_BsdasriBrokerCompanySiretIdx" ON "Bsdasri"("brokerCompanySiret");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_BsdasriIntermediariesOrgIdsIdx" ON "Bsdasri" USING GIN ("intermediariesOrgIds");
