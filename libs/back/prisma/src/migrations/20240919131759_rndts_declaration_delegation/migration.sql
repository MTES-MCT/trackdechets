-- CreateTable
CREATE TABLE "RndtsDeclarationDelegation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "delegateId" VARCHAR(30) NOT NULL,
    "delegatorId" VARCHAR(30) NOT NULL,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "comment" VARCHAR(500),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RndtsDeclarationDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RndtsDeclarationDelegationDelegateIdIdx" ON "RndtsDeclarationDelegation"("delegateId");

-- CreateIndex
CREATE INDEX "_RndtsDeclarationDelegationDelegatorIdIdx" ON "RndtsDeclarationDelegation"("delegatorId");

-- AddForeignKey
ALTER TABLE "RndtsDeclarationDelegation" ADD CONSTRAINT "RndtsDeclarationDelegation_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RndtsDeclarationDelegation" ADD CONSTRAINT "RndtsDeclarationDelegation_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
