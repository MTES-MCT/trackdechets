ALTER TABLE
    "default$default"."Bsff"
ADD COLUMN
    "transporterRecepisseIsExempted" BOOLEAN DEFAULT FALSE;

UPDATE "default$default"."Bsff" SET "transporterRecepisseIsExempted" = true WHERE "transporterRecepisseNumber" IS NULL;
