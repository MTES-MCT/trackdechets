// Response from /api/sirene/v3/etablissements/<VOTRE_SIRET>
export interface SearchResponse {
  etablissement: {
    siret: string;
    etat_administratif: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    code_commune: string;
    libelle_commune: string;
    longitude: string;
    latitude: string;
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

// Response from /api/sirene/v1/full_text/<CLUE>
export interface FullTextSearchResponse {
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
    longitude: string;
    latitude: string;
    geo_adresse: string;
  }[];
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
  longitude: number;
  latitude: number;
}
