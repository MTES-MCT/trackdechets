package main

// SiretError When the siret does not have the correct format
type SiretError struct {
	Detail string
}

// APIResponse INSEE API response object
type APIResponse struct {
	Etablissement Etablissement `json:"etablissement"`
}

// APIMultiResponse INSEE API response object
type APIMultiResponse struct {
	Etablissements []Etablissement `json:"etablissement"`
}

// Etablissement Etablissement lié au SIRET
type Etablissement struct {
	Siret                     string `json:"siret"`
	Siren                     string `json:"siren"`
	NomRaisonSociale          string `json:"nom_raison_sociale"`
	ActivitePrincipale        string `json:"activite_principale"`
	LibelleActivitePrincipale string `json:"libelle_activite_principale"`
	GeoAdresse                string `json:"geo_adresse"`
	LibelleCommune            string `json:"libelle_commune"`
	LibelleVoie               string `json:"libelle_voie"`
	Longitude                 string `json:"longitude"`
	Latitude                  string `json:"latitude"`
	Departement               string `json:"departement"`
}

// Response La réponse donnée par l'API
type Response struct {
	Siret       string `json:"siret"`
	Siren       string `json:"siren"`
	Name        string `json:"name"`
	Naf         string `json:"naf"`
	LibelleNaf  string `json:"libelleNaf"`
	Address     string `json:"address"`
	Longitude   string `json:"longitude"`
	Latitude    string `json:"latitude"`
	Departement string `json:"departement"`
}
