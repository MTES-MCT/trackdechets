-- CreateTable
CREATE TABLE "default$default"."BsddReview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bsddId" TEXT NOT NULL,
    "fromCompanyId" TEXT NOT NULL,
    "toCompanyId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isAccepted" BOOLEAN,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."BsddReview" ADD FOREIGN KEY ("fromCompanyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddReview" ADD FOREIGN KEY ("toCompanyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."BsddReview" ADD FOREIGN KEY ("bsddId") REFERENCES "default$default"."Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;