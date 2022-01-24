-- CreateTable
CREATE TABLE "default$default"."Event" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "streamId" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "actorId" VARCHAR(50) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."Event" ADD FOREIGN KEY ("actorId") REFERENCES "default$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;