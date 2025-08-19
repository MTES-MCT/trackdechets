-- For companies with companyTypes=WORKER but no worker certification (or an empty certification)
-- we remove the WORKER type

UPDATE "Company" c
SET "companyTypes" = array_remove(c."companyTypes", 'WORKER'::"CompanyType")
WHERE 'WORKER' = ANY(c."companyTypes")
  AND (
    c."workerCertificationId" IS NULL
    OR NOT EXISTS (
      SELECT 1
      FROM "WorkerCertification" wc
      WHERE wc.id = c."workerCertificationId"
        AND (wc."hasSubSectionThree" = true OR wc."hasSubSectionFour" = true)
    )
  );
