ALTER TYPE "default$default"."CompanyType" ADD VALUE 'WORKER';

CREATE TABLE IF NOT EXISTS "default$default"."WorkerCertification"
(
    id                      VARCHAR(30) NOT NULL CONSTRAINT "WorkerCertification_pkey" PRIMARY KEY,
    "hasSubSectionFour"     BOOLEAN NOT NULL default FALSE,
    "hasSubSectionThree"    BOOLEAN NOT NULL default FALSE,
    "certificationNumber"   VARCHAR(50),
    "validityLimit"         TIMESTAMPTZ(6),
    organisation            VARCHAR(30)
);

ALTER TABLE "default$default"."Company"
    ADD COLUMN "workerCertificationId" VARCHAR(40);


ALTER TABLE "default$default"."Company"
    ADD FOREIGN KEY ("workerCertificationId")
    REFERENCES "default$default"."WorkerCertification"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "default$default"."Bsda"
    ADD COLUMN "workerCertificationHasSubSectionFour" BOOLEAN,
    ADD COLUMN "workerCertificationHasSubSectionThree" BOOLEAN,
    ADD COLUMN "workerCertificationCertificationNumber" VARCHAR(50),
    ADD COLUMN "workerCertificationValidityLimit" TIMESTAMPTZ(6),
    ADD COLUMN "workerCertificationOrganisation" VARCHAR(30);