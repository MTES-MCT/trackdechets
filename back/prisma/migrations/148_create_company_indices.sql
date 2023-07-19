-- Ajout d'inexes pour la query `companiesForVerification`
-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyCreatedAtIdx" ON "default$default"."Company"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyTypesIdx" ON "default$default"."Company"("companyTypes");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyVerificationStatusIdx" ON "default$default"."Company"("verificationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyAssociationRoleIdx" ON "default$default"."CompanyAssociation"("role");