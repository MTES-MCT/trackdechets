-- CreateTable
CREATE TABLE "default$default"."Event" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streamId" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "actorId" VARCHAR(50) NOT NULL,

    PRIMARY KEY ("id")
);

-- Index
CREATE INDEX IF NOT EXISTS "_EventStreamIdIdx" ON "default$default"."Event"("streamId");
CREATE INDEX IF NOT EXISTS "_EventActorIdIdx" ON "default$default"."Event"("actorId");