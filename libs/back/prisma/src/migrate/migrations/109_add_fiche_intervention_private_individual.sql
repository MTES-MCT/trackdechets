ALTER TABLE
    "default$default"."BsffFicheIntervention"
ADD
    COLUMN "detenteurIsPrivateIndividual" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE
    "default$default"."BsffFicheIntervention"
ALTER COLUMN
    "detenteurCompanySiret" DROP NOT NULL;