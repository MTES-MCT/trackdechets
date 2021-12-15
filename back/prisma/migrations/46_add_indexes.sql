-- CompanyAssociation

CREATE INDEX IF NOT EXISTS "_CompanyAssociationUserIdIdx" ON "default$default"."CompanyAssociation"("userId");
CREATE INDEX IF NOT EXISTS "_CompanyAssociationCompanyIdIdx" ON "default$default"."CompanyAssociation"("companyId");

-- MembershipRequest

CREATE INDEX IF NOT EXISTS "_MembershipRequestUserIdIdx" ON "default$default"."MembershipRequest"("userId");
CREATE INDEX IF NOT EXISTS "_MembershipRequestCompanyIdIdx" ON "default$default"."MembershipRequest"("companyId");

-- StatusLog

CREATE INDEX IF NOT EXISTS "_StatusLogUserIdIdx" ON "default$default"."StatusLog"("userId");
CREATE INDEX IF NOT EXISTS "_StatusLogFormIdIdx" ON "default$default"."StatusLog"("formId");

-- UserAccountHash

CREATE INDEX IF NOT EXISTS "_UserAccountHashEmailIdx" ON "default$default"."UserAccountHash"("email");
CREATE INDEX IF NOT EXISTS "_UserAccountHashCompanySiretIdx" ON "default$default"."UserAccountHash"("companySiret");

-- UserActivationHash

CREATE INDEX IF NOT EXISTS "_UserActivationHashUserIdIdx" ON "default$default"."UserActivationHash"("userId");

-- Form

CREATE INDEX IF NOT EXISTS "_FormStatusIdx" ON "default$default"."Form"("status");
CREATE INDEX IF NOT EXISTS "_FormAppendix2RootFormIdIdx" ON "default$default"."Form"("appendix2RootFormId");

-- Bsvhu

CREATE INDEX IF NOT EXISTS "_BsvhuStatusIdx" ON "default$default"."Bsvhu"("status");

-- Bsda

CREATE INDEX IF NOT EXISTS "_BsdaStatusIdx" ON "default$default"."Bsda"("status");

-- Bsff

CREATE INDEX IF NOT EXISTS "_BsffStatusIdx" ON "default$default"."Bsff"("status");

-- Bsdasri

CREATE INDEX IF NOT EXISTS "_BsdasriStatusIdx" ON "default$default"."Bsdasri"("status");

-- TransportSegment

CREATE INDEX IF NOT EXISTS "_TransportSegmentFormIdIdx" ON "default$default"."TransportSegment"("formId");
