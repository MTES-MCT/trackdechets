-- CreateEnum
CREATE TYPE "default$default"."RevisionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bsddId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "comment" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestStatus" DEFAULT E'PENDING',

    PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "default$default"."RevisionRequestApprovalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED');

-- CreateTable
CREATE TABLE "default$default"."BsddRevisionRequestApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "approverSiret" TEXT NOT NULL,
    "status" "default$default"."RevisionRequestApprovalStatus" DEFAULT E'PENDING',
    "comment" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("authorId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequest" ADD FOREIGN KEY ("bsddId") REFERENCES "default$default"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddRevisionRequestApproval" ADD FOREIGN KEY ("revisionRequestId") REFERENCES "default$default"."BsddRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
