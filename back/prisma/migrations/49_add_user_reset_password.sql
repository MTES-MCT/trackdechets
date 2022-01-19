-- CreateTable
CREATE TABLE "UserResetPasswordHash" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "hashExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserResetPasswordHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserResetPasswordHash_hash_key" ON "UserResetPasswordHash"("hash");

-- CreateIndex
CREATE INDEX "UserResetPasswordHashIdIdx" ON "UserResetPasswordHash"("userId");

-- AddForeignKey
ALTER TABLE "UserResetPasswordHash" ADD CONSTRAINT "UserResetPasswordHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
