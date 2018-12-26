package main

import (
	"crypto/tls"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"encoding/json"

	"github.com/gorilla/mux"
)

// check panics on error
func check(e error) {
	if e != nil {
		panic(e)
	}
}

func main() {
	generateToken()

	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/ping", Ping).Methods("GET")
	router.HandleFunc("/siret/{siret}", Siret).Methods("GET")
	log.Fatal(http.ListenAndServe(":81", router))
}

// Ping Pour vérifier l'état de l'API
func Ping(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Pong")
}

// Siret Interroge l'API de l'insee pour récupérer des informations sur un SIRET
func Siret(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	siret := vars["siret"]

	w.Header().Set("Content-Type", "application/json")
	strippedSiret := strings.Replace(siret, " ", "", -1)

	if len(strippedSiret) != 14 {
		siretError, err := json.Marshal(SiretError{"Le SIRET doit faire 14 caractères."})
		check(err)

		w.Write(siretError)
		return
	}

	// Ingnore certificate check (cf `curl -k`)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	req, err := http.NewRequest("GET", "https://api.insee.fr/entreprises/sirene/V3/siret/"+strippedSiret, nil)

	req.Header.Add("Accept", `application/json`)
	req.Header.Add("Authorization", `Bearer `+readToken())

	resp, err := client.Do(req)
	check(err)

	responseData, err := ioutil.ReadAll(resp.Body)
	check(err)

	var fullResponseObject APIResponse
	json.Unmarshal(responseData, &fullResponseObject)

	jsonReponse, err := json.Marshal(Response{strippedSiret,
		fullResponseObject.Etablissement.Siren,
		fullResponseObject.Etablissement.UniteLegale.DenominationUniteLegale,
		fullResponseObject.Etablissement.AdresseEtablissement.NumeroVoieEtablissement + " " +
			fullResponseObject.Etablissement.AdresseEtablissement.TypeVoieEtablissement + " " +
			fullResponseObject.Etablissement.AdresseEtablissement.LibelleVoieEtablissement + ", " +
			fullResponseObject.Etablissement.AdresseEtablissement.CodePostalEtablissement + " " +
			fullResponseObject.Etablissement.AdresseEtablissement.LibelleCommuneEtablissement})

	check(err)
	w.Write(jsonReponse)
}
