-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bsddId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "comment" TEXT NOT NULL,
    "isSettled" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "default$default"."RevisionRequestAcceptationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequestValidation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestAcceptationStatus" DEFAULT E'PENDING',

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("requestedById") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("bsddId") REFERENCES "default$default"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequestValidation" ADD FOREIGN KEY ("bsddRevisionRequestId") REFERENCES "default$default"."BsddRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequestValidation" ADD FOREIGN KEY ("companyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;