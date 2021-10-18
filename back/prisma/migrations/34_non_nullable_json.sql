UPDATE "default$default"."Form" SET "wasteDetailsPackagingInfos" = '[]' WHERE "wasteDetailsPackagingInfos" IS NULL;
UPDATE "default$default"."TemporaryStorageDetail" SET "wasteDetailsPackagingInfos" = '[]' WHERE "wasteDetailsPackagingInfos" IS NULL;

ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsPackagingInfos" SET NOT NULL;
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "wasteDetailsPackagingInfos" SET NOT NULL;

UPDATE "default$default"."Bsdasri" SET "emitterWastePackagingsInfo" = '[]' WHERE "emitterWastePackagingsInfo" IS NULL;
UPDATE "default$default"."Bsdasri" SET "transporterWastePackagingsInfo" = '[]' WHERE "transporterWastePackagingsInfo" IS NULL;
UPDATE "default$default"."Bsdasri" SET "recipientWastePackagingsInfo" = '[]' WHERE "recipientWastePackagingsInfo" IS NULL;

ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "emitterWastePackagingsInfo" SET NOT NULL;
ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "transporterWastePackagingsInfo" SET NOT NULL;
ALTER TABLE "default$default"."Bsdasri" ALTER COLUMN "recipientWastePackagingsInfo" SET NOT NULL;

UPDATE "default$default"."Bsff" SET "packagings" = '[]' WHERE "packagings" IS NULL;
ALTER TABLE "default$default"."Bsff" ALTER COLUMN "packagings" SET NOT NULL;

UPDATE "default$default"."Bsda" SET "packagings" = '[]' WHERE "packagings" IS NULL;
ALTER TABLE "default$default"."Bsda" ALTER COLUMN "packagings" SET NOT NULL;
