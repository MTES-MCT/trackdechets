package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
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

var gouvAPIClient = newClient()

func main() {
	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/ping", Ping).Methods("GET")
	router.HandleFunc("/siret/{siret}", Siret).Methods("GET")
	router.HandleFunc("/search", Search).Methods("GET")
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

	responseData, err := gouvAPIClient.queryAPI("/siret/" + strippedSiret)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

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

	w.Header().Set("Content-Type", "application/json")

	uri := buildSearchURI(r.URL.Query())

	res, err := gouvAPIClient.queryAPI(uri)
	if err != nil {
		w.Write([]byte(err.Error()))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

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

func buildSearchURI(query url.Values) string {

	uri := "/full_text"

	clues, ok := query["clue"]
	if !ok || len(clues[0]) < 1 {
		log.Panicln("Url Param 'clue' is missing")
	}

	uri = uri + "/" + clues[0]

	departments, ok := query["department"]

	if ok {
		params := url.Values{}
		if len(departments[0]) == 2 {
			params.Set("departement", departments[0])
		} else if len(departments[0]) == 5 {
			params.Set("code_postal", departments[0])
		}
		uri = uri + "?" + params.Encode()
	}

	return uri
}

func etablissementToResponse(item Etablissement) Response {
	return Response{item.Siret,
		item.Siren,
		item.NomRaisonSociale,
		item.ActivitePrincipale,
		item.LibelleActivitePrincipale,
		item.GeoAdresse,
		item.Longitude,
		item.Latitude,
		item.Departement}
}
