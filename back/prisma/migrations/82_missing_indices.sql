-- Bsdasris
CREATE INDEX IF NOT EXISTS "_BsdasriEcoOrganismeSiretIdx" ON "default$default"."Bsdasri"("ecoOrganismeSiret");
CREATE INDEX IF NOT EXISTS "_BsdasriSynthesizedInIdIdx" ON "default$default"."Bsdasri"("synthesizedInId");
CREATE INDEX IF NOT EXISTS "_BsdasriGroupedInIdIdx" ON "default$default"."Bsdasri"("groupedInId");
CREATE INDEX IF NOT EXISTS "_BsdasriTypeIdx" ON "default$default"."Bsdasri"("type");
CREATE INDEX IF NOT EXISTS "_BsdasriIsDraftIdx" ON default$default."Bsdasri" ("isDraft") WHERE "Bsdasri"."isDraft"=true;
CREATE INDEX IF NOT EXISTS "_BsdasriIsDeletedIdx" ON default$default."Bsdasri"("isDeleted") WHERE "Bsdasri"."isDeleted"=true;
 
-- Bsda
CREATE INDEX IF NOT EXISTS "_BsdaGroupedInIdIdx" ON "default$default"."Bsda"("groupedInId");
CREATE INDEX IF NOT EXISTS "_BsdaIsDeletedIdx" ON default$default."Bsda"("isDeleted") WHERE "Bsda"."isDeleted"=true;
CREATE INDEX IF NOT EXISTS "_BsdaIsDraftIdx" ON default$default."Bsda"("isDraft") WHERE "Bsda"."isDraft"=true;

-- Bsff
CREATE INDEX IF NOT EXISTS "_BsffIsDeletedIdx" ON default$default."Bsff"("isDeleted") WHERE "Bsff"."isDeleted"=true;
CREATE INDEX IF NOT EXISTS "_BsffIsDraftIdx" ON default$default."Bsff"("isDraft") WHERE "Bsff"."isDraft"=true;

-- Bsvhu
CREATE INDEX IF NOT EXISTS "_BsvhuIsDeletedIdx" ON default$default."Bsvhu" ("isDeleted") WHERE "Bsvhu"."isDeleted"=true;
CREATE INDEX IF NOT EXISTS "_BsvhuIsDraftIdx" ON default$default."Bsvhu"("isDraft") WHERE "Bsvhu"."isDraft"=true;

-- Form
CREATE INDEX IF NOT EXISTS "_FormEcoOrganismeSiretIdx" ON "default$default"."Form"("ecoOrganismeSiret");
CREATE INDEX IF NOT EXISTS "_FormIsDeletedIdx" ON default$default."Form"("isDeleted") WHERE "Form"."isDeleted"=true;