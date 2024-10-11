-- CreateTable
CREATE TABLE "RegistryDelegation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "delegateId" VARCHAR(30) NOT NULL,
    "delegatorId" VARCHAR(30) NOT NULL,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "comment" VARCHAR(500),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RegistryDelegation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RegistryDelegationDelegateIdIdx" ON "RegistryDelegation"("delegateId");

-- CreateIndex
CREATE INDEX "_RegistryDelegationDelegatorIdIdx" ON "RegistryDelegation"("delegatorId");

-- AddForeignKey
ALTER TABLE "RegistryDelegation" ADD CONSTRAINT "RegistryDelegation_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryDelegation" ADD CONSTRAINT "RegistryDelegation_delegatorId_fkey" FOREIGN KEY ("delegatorId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
