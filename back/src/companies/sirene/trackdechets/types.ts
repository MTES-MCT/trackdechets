import { StatutDiffusionEtablissement } from "../../../generated/graphql/types";

export interface SearchStockEtablissement {
  siren: string;
  nic: string;
  siret: string;
  statutDiffusionEtablissement: StatutDiffusionEtablissement;
  dateCreationEtablissement: string;
  trancheEffectifsEtablissement: string;
  anneeEffectifsEtablissement: string;
  activitePrincipaleRegistreMetiersEtablissement: string;
  dateDernierTraitementEtablissement: string;
  etablissementSiege: string;
  nombrePeriodesEtablissement: string;
  complementAdresseEtablissement: string;
  numeroVoieEtablissement: string;
  indiceRepetitionEtablissement: string;
  typeVoieEtablissement: string;
  libelleVoieEtablissement: string;
  codePostalEtablissement: string;
  libelleCommuneEtablissement: string;
  libelleCommuneEtrangerEtablissement: string;
  distributionSpecialeEtablissement: string;
  codeCommuneEtablissement: string;
  codeCedexEtablissement: string;
  libelleCedexEtablissement: string;
  codePaysEtrangerEtablissement: string;
  libellePaysEtrangerEtablissement: string;
  complementAdresse2Etablissement: string;
  numeroVoie2Etablissement: string;
  indiceRepetition2Etablissement: string;
  typeVoie2Etablissement: string;
  libelleVoie2Etablissement: string;
  codePostal2Etablissement: string;
  libelleCommune2Etablissement: string;
  libelleCommuneEtranger2Etablissement: string;
  distributionSpeciale2Etablissement: string;
  codeCommune2Etablissement: string;
  codeCedex2Etablissement: string;
  libelleCedex2Etablissement: string;
  codePaysEtranger2Etablissement: string;
  libellePaysEtranger2Etablissement: string;
  dateDebut: string;
  etatAdministratifEtablissement: string;
  enseigne1Etablissement: string;
  enseigne2Etablissement: string;
  enseigne3Etablissement: string;
  denominationUsuelleEtablissement: string;
  activitePrincipaleEtablissement: string;
  nomenclatureActivitePrincipaleEtablissement: string;
  caractereEmployeurEtablissement: string;
  unitePurgeeUniteLegale: string;
  dateCreationUniteLegale: string;
  sigleUniteLegale: string;
  sexeUniteLegale: string;
  prenom1UniteLegale: string;
  prenom2UniteLegale: string;
  prenom3UniteLegale: string;
  prenom4UniteLegale: string;
  prenomUsuelUniteLegale: string;
  pseudonymeUniteLegale: string;
  identifiantAssociationUniteLegale: string;
  trancheEffectifsUniteLegale: string;
  anneeEffectifsUniteLegale: string;
  dateDernierTraitementUniteLegale: string;
  nombrePeriodesUniteLegale: string;
  categorieEntreprise: string;
  anneeCategorieEntreprise: string;
  etatAdministratifUniteLegale: string;
  nomUniteLegale: string;
  nomUsageUniteLegale: string;
  denominationUniteLegale: string;
  denominationUsuelle1UniteLegale: string;
  denominationUsuelle2UniteLegale: string;
  denominationUsuelle3UniteLegale: string;
  categorieJuridiqueUniteLegale: string;
  activitePrincipaleUniteLegale: string;
  nomenclatureActivitePrincipaleUniteLegale: string;
  nicSiegeUniteLegale: string;
  economieSocialeSolidaireUniteLegale: string;
  caractereEmployeurUniteLegale: string;
}

/**
 * Partial Search API parameters
 * Docs https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html
 */
export interface SearchOptions {
  body: any;
  index: string | string[];
  analyzer?: string;
  analyze_wildcard?: boolean;
  explain?: boolean;
  from?: number;
  size?: number;
  sort?: string | string[];
  _source?: string | string[];
  _source_excludes?: string | string[];
  _source_includes?: string[];
}

export interface SearchResponse {
  timed_out: boolean;
  took: number;
  hits: {
    total: { value: number; relation: "eq" | "gte" };
    max_score: number;
    hits: SearchHit[];
  };
}

export interface SearchHit {
  _id: string;
  _score: number;
  _source: SearchStockEtablissement;
}
