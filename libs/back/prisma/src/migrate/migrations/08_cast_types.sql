--- Fix types incoherences

ALTER TABLE "default$default"."Form"
ALTER COLUMN "wasteDetailsPackagingInfos"
SET DATA TYPE JSONB USING "wasteDetailsPackagingInfos"::TEXT::JSONB;


ALTER TABLE "default$default"."TemporaryStorageDetail"
ALTER COLUMN "wasteDetailsPackagingInfos"
SET DATA TYPE JSONB USING "wasteDetailsPackagingInfos"::TEXT::JSONB;


ALTER TABLE "default$default"."Form"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" SET DATA TYPE "default$default"."Status" using "status"::"default$default"."Status",
ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"default$default"."Status";


CREATE TYPE "default$default"."AuthType" AS ENUM ('SESSION', 'BEARER', 'JWT');

ALTER TABLE "default$default"."StatusLog"
ALTER COLUMN "authType"
SET DATA TYPE "default$default"."AuthType"
using "authType"::"default$default"."AuthType";
