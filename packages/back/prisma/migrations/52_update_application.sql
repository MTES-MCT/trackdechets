-- Reverse the relation between Application and User
-- Instead of an application having multiple admins, a user
-- can be admin of several applications

-- AlterTable
ALTER TABLE
  "default$default"."Application"
ADD
  COLUMN "adminId" TEXT;

-- I doubled checked on prod and staging : there is no application with several admins
-- If an application is created before MEP with several admins, only the first
-- one will be picked
UPDATE
  "default$default"."Application"
SET
  "adminId" = "default$default"."User"."id"
FROM
  "default$default"."User"
WHERE
  "default$default"."User"."applicationId" = "default$default"."Application"."id";

-- AlterTable
ALTER TABLE
  "default$default"."User" DROP COLUMN "applicationId";

-- AddForeignKey
ALTER TABLE
  "default$default"."Application"
ADD
  CONSTRAINT "Application_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "default$default"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "default$default"."ApplicationGoal" AS ENUM ('PERSONNAL', 'CLIENTS');
ALTER TABLE "default$default"."Application" ADD COLUMN "goal" "default$default"."ApplicationGoal";