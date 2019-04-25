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
	Etablissements []Etablissement `json:"etablissements"`
}

// Etablissement Etablissement lié au SIRET
type Etablissement struct {
	Siret                string               `json:"siret"`
	Siren                string               `json:"siren"`
	UniteLegale          UniteLegale          `json:"uniteLegale"`
	AdresseEtablissement AdresseEtablissement `json:"adresseEtablissement"`
}

// UniteLegale Unité légale liée au SIRET
type UniteLegale struct {
	DenominationUniteLegale string `json:"denominationUniteLegale"`
}

// AdresseEtablissement Adresse et détail de l'établissement
type AdresseEtablissement struct {
	NumeroVoieEtablissement     string `json:"numeroVoieEtablissement"`
	TypeVoieEtablissement       string `json:"typeVoieEtablissement"`
	LibelleVoieEtablissement    string `json:"libelleVoieEtablissement"`
	CodePostalEtablissement     string `json:"codePostalEtablissement"`
	LibelleCommuneEtablissement string `json:"libelleCommuneEtablissement"`
}

// Response La réponse donnée par l'API
type Response struct {
	Siret   string `json:"siret"`
	Siren   string `json:"siren"`
	Name    string `json:"name"`
	Address string `json:"address"`
}
