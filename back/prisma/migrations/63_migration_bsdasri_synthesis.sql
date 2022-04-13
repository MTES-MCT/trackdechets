ALTER TABLE "default$default"."Bsdasri" 
    ADD COLUMN "synthesizedInId" TEXT;
ALTER TABLE "default$default"."Bsdasri" 
    ADD FOREIGN KEY("synthesizedInId") REFERENCES "default$default"."Bsdasri"("id") ON DELETE SET NULL ON UPDATE CASCADE;