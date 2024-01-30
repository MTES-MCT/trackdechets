import { StatutDiffusionEtablissement } from "../../generated/graphql/types";

/**
 * Interface des résultats sur la base Sirene INSEE
 */
export interface SireneSearchResult {
  addressVoie?: string;
  addressPostalCode?: string;
  addressCity?: string;
  /** Adresse de l'établissement */
  address?: string;
  /** Code commune de l'établissement */
  codeCommune?: string;
  /** Code pays de l'établissement */
  codePaysEtrangerEtablissement?: string;

  /** État administratif de l'établissement. A = Actif, F = Fermé */
  etatAdministratif?: string;
  /** Si oui on non cet établissement est inscrit sur la plateforme Trackdéchets */
  isRegistered?: boolean;
  /** Libellé NAF */
  libelleNaf?: string;
  /** Code NAF */
  naf?: string;
  /** Nom de l'établissement */
  name?: string;
  /** SIRET de l'établissement */
  siret?: string;
  /** Statut de diffusion des informations de l'établisement selon l'INSEE */
  statutDiffusionEtablissement: StatutDiffusionEtablissement;
}

interface PeriodeEtablissementInsee {
  etatAdministratifEtablissement: string;
  activitePrincipaleEtablissement: string;
}

export interface EtablissementInsee {
  siret: string;
  uniteLegale: {
    denominationUniteLegale: string;
    categorieJuridiqueUniteLegale: string;
    prenom1UniteLegale: string;
    nomUniteLegale: string;
    sigleUniteLegale: string;
  };
  adresseEtablissement: {
    numeroVoieEtablissement: string;
    indiceRepetitionEtablissement: string;
    complementAdresseEtablissement: string;
    typeVoieEtablissement: string;
    libelleVoieEtablissement: string;
    codePostalEtablissement: string;
    libelleCommuneEtablissement: string;
    codeCommuneEtablissement: string;
  };
  periodesEtablissement: PeriodeEtablissementInsee[];
  statutDiffusionEtablissement: StatutDiffusionEtablissement;
  denominationUsuelleEtablissement: string;
  enseigne1Etablissement: string;
  enseigne2Etablissement: string;
  enseigne3Etablissement: string;
}

// Response from https://api.insee.fr/entreprises/siret/V3/siret/<VOTRE_SIRET>
export interface SearchResponseInsee {
  etablissement: EtablissementInsee;
}

// Response from https://api.insee.fr/entreprises/siret/V3/siret/
export interface FullTextSearchResponseInsee {
  etablissements: EtablissementInsee[];
}
