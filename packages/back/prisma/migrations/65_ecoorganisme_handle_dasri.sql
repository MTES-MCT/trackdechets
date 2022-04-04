ALTER TABLE "default$default"."EcoOrganisme" 
    ADD COLUMN "handleBsdasri" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "default$default"."Bsdasri" 
    ADD COLUMN "emittedByEcoOrganisme" BOOLEAN NOT NULL DEFAULT false;
 