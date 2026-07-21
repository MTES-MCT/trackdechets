-- CreateTable: MfaReconfigToken
CREATE TABLE "MfaReconfigToken" (
  "id"           VARCHAR(30)    NOT NULL,
  "userId"       VARCHAR(30)    NOT NULL,
  "token"        VARCHAR(64)    NOT NULL,
  "tokenExpires" TIMESTAMPTZ(6) NOT NULL,
  "used"         BOOLEAN        NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "MfaReconfigToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MfaReconfigToken"
  ADD CONSTRAINT "MfaReconfigToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "MfaReconfigToken.token._UNIQUE" ON "MfaReconfigToken"("token");
CREATE INDEX "_MfaReconfigTokenUserIdIdx" ON "MfaReconfigToken"("userId");
CREATE INDEX "_MfaReconfigTokenTokenExpiresIdx" ON "MfaReconfigToken"("tokenExpires");
CREATE INDEX "_MfaReconfigTokenUsedIdx" ON "MfaReconfigToken"("used");
