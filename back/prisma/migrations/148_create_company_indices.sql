-- Ajout d'inexes pour la query `companiesForVerification`
-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyCreatedAtIdx" ON "default$default"."Company"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyVerificationStatusIdx" ON "default$default"."Company"("verificationStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_CompanyAssociationRoleIdx" ON "default$default"."CompanyAssociation"("role");

-- Create GIN Index
-- > GIN indexes are “inverted indexes” which are appropriate for data values that 
-- > contain multiple component values, such as arrays.
-- > An inverted index contains a separate entry for each component value, 
-- > and can efficiently handle queries that test for the presence of specific component values.
CREATE INDEX IF NOT EXISTS "_CompanyTypesIdx" ON "default$default"."Company" USING GIN ("companyTypes");