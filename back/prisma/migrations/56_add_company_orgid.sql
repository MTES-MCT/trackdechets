-- Create Enum
CREATE TYPE "default$default"."OrgRegistry" AS ENUM (
  "SIRENE",
  "TVAINTRACOMM",
  "RNA",
  "FULLNAME",
  "FOREIGNID",
  "OMI",
  "RNC",
  "PNTTD");

-- Create new column
ALTER TABLE "default$default"."Company" ADD "orgId" TEXT NOT NULL UNIQUE;
ALTER TABLE "default$default"."Company" ADD "orgIdRegistry" "default$default"."OrgRegistry";


--- Create index
CREATE INDEX IF NOT EXISTS "_CompanyOrgIdIdx" ON "default$default"."Company"("orgId");

-- Create Table
CREATE TABLE "default$default"."OrganisationRegistry" (
    "orgRegistry" "default$default"."OrgRegistry" NOT NULL UNIQUE;
    "label"       TEXT
    "description" TEXT

    PRIMARY KEY ("orgRegistry")
);

--- Create index
CREATE INDEX IF NOT EXISTS "_OrganisationRegistryOrgRegistryIdx" ON "default$default"."OrganisationRegistry"("orgRegistry");

INSERT INTO "default$default"."OrganisationRegistry" ("orgRegistry", "label", "description")
  ("SIRENE", "SIRET", "Registre français des unités légales et établissements identifés par Siret (INSEE)"),
  ("TVAINTRACOMM", "TVA", "Registre européen des entreprises VIES (Commission Européenne)"),
  ("RNA", "RNA", "Répertoire National des Associations (Ministère de l'intérieur français)"),
  ("FULLNAME", "Prénom Nom", "Désignation d'une personne physique"),
  ("FOREIGNID", "Identifiant entreprise étrangère", "Désignation d'une entreprise étrangère hors-UE qui n'a ni SIRET ni numéro TVA intracommunautaire(délivré par le pays d'implantation)"),
  ("OMI", "OMI", "Désignation d'un navire (Organisation maritime internationale)"),
  ("PNTTD", "PNTTD", "Pôle National des Transferts Transfrontaliers de Déchets (Ministère de la transition écologique français)"),
  ("RNC", "RNC", "Registre national des copropriétés (Agence Nationale de l'Habitat française))");
