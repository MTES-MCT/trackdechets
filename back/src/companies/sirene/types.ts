// Response from https://api.entreprise.data.gouv.fr/api/sirene/v3/etablissements/<VOTRE_SIRET>
export interface SearchResponseDataGouv {
  etablissement: {
    siret: string;
    etat_administratif: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    code_commune: string;
    libelle_commune: string;
    geo_adresse: string;
    unite_legale: {
      denomination: string;
      prenom_1: string;
      nom: string;
      activite_principale: string;
      categorie_juridique: string;
    };
  };
}

interface EtablissementInsee {
  siret: string;
  uniteLegale: {
    denominationUniteLegale: string;
    categorieJuridiqueUniteLegale: string;
    etatAdministratifUniteLegale: string;
    prenom1UniteLegale: string;
    nomUniteLegale: string;
    activitePrincipaleUniteLegale: string;
  };
  adresseEtablissement: {
    numeroVoieEtablissement: string;
    typeVoieEtablissement: string;
    libelleVoieEtablissement: string;
    codePostalEtablissement: string;
    libelleCommuneEtablissement: string;
    codeCommuneEtablissement: string;
  };
}

// Response from https://api.insee.fr/entreprises/siret/V3/siret/<VOTRE_SIRET>
export interface SearchResponseInsee {
  etablissement: EtablissementInsee;
}

// Response from https://api.entreprise.data.gouv.fr/api/sirene/v1/full_text/<CLUE>
export interface FullTextSearchResponseDataGouv {
  etablissement: {
    siret: string;
    nom_raison_sociale: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    departement_commune_siege: string;
    libelle_commune: string;
    activite_principale: string;
    libelle_activite_principale: string;
    geo_adresse: string;
  }[];
}

// Response from https://api.insee.fr/entreprises/siret/V3/siret/
export interface FullTextSearchResponseInsee {
  etablissements: EtablissementInsee[];
}

// return type for functions searchCompany and searchCompanies
export interface CompanySearchResult {
  siret: string;
  etatAdministratif?: string;
  address: string;
  codeCommune?: string;
  name: string;
  naf: string;
  libelleNaf: string;
}
