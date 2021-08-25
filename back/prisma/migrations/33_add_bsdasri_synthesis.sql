-- AlterTable
ALTER TABLE "default$default"."Bsdasri" ADD COLUMN "synthesizedOnBsdasriId" TEXT;
ALTER TABLE "default$default"."Bsdasri" ADD FOREIGN KEY("synthesizedOnBsdasriId") REFERENCES "default$default"."Bsdasri"("id") ON DELETE SET NULL ON UPDATE CASCADE;
