// Response from /api/sirene/v3/etablissements/<VOTRE_SIRET>
interface SearchResponse {
  etablissement: {
    siret: string;
    etat_administratif: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    longitude: string;
    latitude: string;
    geo_adresse: string;
    unite_legale: {
      denomination: string;
      activite_principale: string;
    };
  };
}

// Response from /api/sirene/v1/full_text/<CLUE>
interface FullTextSearchResponse {
  etablissement: {
    siret: string;
    nom_raison_sociale: string;
    numero_voie: string;
    type_voie: string;
    libelle_voie: string;
    code_postal: string;
    libelle_commune: string;
    activite_principale: string;
    libelle_activite_principale: string;
    longitude: string;
    latitude: string;
    geo_adresse: string;
  }[];
}

// return type for mutation { searchCompanies }
interface CompanySearchResult {
  siret: string;
  etatAdministratif?: string;
  address: string;
  name: string;
  naf: string;
  libelleNaf: string;
  longitude: number;
  latitude: number;
}
