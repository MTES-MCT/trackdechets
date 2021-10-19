UPDATE "default$default"."Form" SET "wasteDetailsPackagingInfos" = '[]' WHERE "wasteDetailsPackagingInfos" IS NULL;
UPDATE "default$default"."TemporaryStorageDetail" SET "wasteDetailsPackagingInfos" = '[]' WHERE "wasteDetailsPackagingInfos" IS NULL;

ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsPackagingInfos" SET NOT NULL;
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "wasteDetailsPackagingInfos" SET NOT NULL;

UPDATE "default$default"."Bsdasri" SET "emitterWastePackagings" = '[]' WHERE "emitterWastePackagings" IS NULL;
UPDATE "default$default"."Bsdasri" SET "transporterWastePackagings" = '[]' WHERE "transporterWastePackagings" IS NULL;
UPDATE "default$default"."Bsdasri" SET "destinationWastePackagings" = '[]' WHERE "destinationWastePackagings" IS NULL;

ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "emitterWastePackagings" SET NOT NULL;
ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "transporterWastePackagings" SET NOT NULL;
ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "destinationWastePackagings" SET NOT NULL;

UPDATE "default$default"."Bsff" SET "packagings" = '[]' WHERE "packagings" IS NULL;
ALTER TABLE "default$default"."Bsff" ALTER COLUMN "packagings" SET NOT NULL;

UPDATE "default$default"."Bsda" SET "packagings" = '[]' WHERE "packagings" IS NULL;
ALTER TABLE "default$default"."Bsda" ALTER COLUMN "packagings" SET NOT NULL;
