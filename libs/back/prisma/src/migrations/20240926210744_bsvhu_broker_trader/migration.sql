-- AlterTable
ALTER TABLE "Bsvhu" ADD COLUMN     "brokerCompanyAddress" TEXT,
ADD COLUMN     "brokerCompanyContact" TEXT,
ADD COLUMN     "brokerCompanyMail" TEXT,
ADD COLUMN     "brokerCompanyName" TEXT,
ADD COLUMN     "brokerCompanyPhone" TEXT,
ADD COLUMN     "brokerCompanySiret" TEXT,
ADD COLUMN     "brokerRecepisseDepartment" TEXT,
ADD COLUMN     "brokerRecepisseNumber" TEXT,
ADD COLUMN     "brokerRecepisseValidityLimit" TIMESTAMPTZ(6),
ADD COLUMN     "traderCompanyAddress" TEXT,
ADD COLUMN     "traderCompanyContact" TEXT,
ADD COLUMN     "traderCompanyMail" TEXT,
ADD COLUMN     "traderCompanyName" TEXT,
ADD COLUMN     "traderCompanyPhone" TEXT,
ADD COLUMN     "traderCompanySiret" TEXT,
ADD COLUMN     "traderRecepisseDepartment" TEXT,
ADD COLUMN     "traderRecepisseNumber" TEXT,
ADD COLUMN     "traderRecepisseValidityLimit" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "_BsvhuBrokerCompanySiretIdx" ON "Bsvhu"("brokerCompanySiret");

-- CreateIndex
CREATE INDEX "_BsvhuTraderCompanySiretIdx" ON "Bsvhu"("traderCompanySiret");
