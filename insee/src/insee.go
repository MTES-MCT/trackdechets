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
	router.HandleFunc("/search/{clue}", Search).Methods("GET")
	log.Fatal(http.ListenAndServe(":81", router))
}

// Ping Pour vérifier l'état de l'API
func Ping(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Pong")
}

// Siret Interroge l'API de l'insee pour récupérer des informations sur un SIRET
func Siret(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			http.Error(w, "Error, cannot reach INSEE.", http.StatusInternalServerError)
		}
	}()

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

	responseData := queryAPI("/" + strippedSiret)

	var fullResponseObject APIResponse
	json.Unmarshal(responseData, &fullResponseObject)

	jsonReponse, err := json.Marshal(etablissementToResponse(fullResponseObject.Etablissement))

	check(err)
	w.Write(jsonReponse)
}

// Search Query INSEE by company name
func Search(w http.ResponseWriter, r *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			http.Error(w, "Error, cannot reach INSEE.", http.StatusInternalServerError)
		}
	}()

	vars := mux.Vars(r)
	clue := vars["clue"]

  w.Header().Set("Content-Type", "application/json")
  // Unfortunately, the API does not support lucene '*' on `denominationUniteLegale`
	res := queryAPI(`?q=denominationUniteLegale:"` + clue + `"&nombre=7`)

	var fullResponseObject APIMultiResponse
	json.Unmarshal(res, &fullResponseObject)

	var responses []Response
	for _, item := range fullResponseObject.Etablissements {
		responses = append(responses, etablissementToResponse(item))
	}
	jsonReponse, err := json.Marshal(responses)

	check(err)
	w.Write(jsonReponse)
}

func queryAPI(uri string) []byte {
	// Ingnore certificate check (cf `curl -k`)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	req, err := http.NewRequest("GET", "https://api.insee.fr/entreprises/sirene/V3/siret"+uri, nil)

	req.Header.Add("Accept", `application/json`)
	req.Header.Add("Authorization", `Bearer `+readToken())

	resp, err := client.Do(req)
	check(err)

	if resp.StatusCode != 200 {
		log.Println("Error while querying INSEE API, received status code", resp.StatusCode, http.StatusText(resp.StatusCode))

		bodyContent, err := ioutil.ReadAll(resp.Body)
		check(err)
		log.Println("Dumping error content...", bodyContent)

		if resp.StatusCode == 401 {
			log.Println("Trying to renew token for next time...")
			generateTokenFromInsee()
		}
	}

	responseData, err := ioutil.ReadAll(resp.Body)
	check(err)

	return responseData
}

func etablissementToResponse(item Etablissement) Response {
	return Response{item.Siret,
		item.Siren,
		item.UniteLegale.DenominationUniteLegale,
		item.AdresseEtablissement.NumeroVoieEtablissement + " " +
			item.AdresseEtablissement.TypeVoieEtablissement + " " +
			item.AdresseEtablissement.LibelleVoieEtablissement + ", " +
			item.AdresseEtablissement.CodePostalEtablissement + " " +
			item.AdresseEtablissement.LibelleCommuneEtablissement}
}
