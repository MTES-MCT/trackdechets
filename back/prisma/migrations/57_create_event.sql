-- CreateTable
CREATE TABLE "default$default"."Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streamId" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "actor" VARCHAR(50) NOT NULL,

    PRIMARY KEY ("id")
);

-- Index
CREATE INDEX IF NOT EXISTS "_EventStreamIdIdx" ON "default$default"."Event"("streamId");
CREATE INDEX IF NOT EXISTS "_EventActorIdx" ON "default$default"."Event"("actor");