package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	mailjet "github.com/mailjet/mailjet-apiv3-go"
	"github.com/mailjet/mailjet-apiv3-go/resources"
)

type contact struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

func singleContactHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Wrong verb.", http.StatusNotFound)
		return
	}

	email := strings.TrimPrefix(r.URL.Path, "/contact/")

	var contact resources.Contact
	info := &mailjet.Request{
		Resource: "contact",
		AltID:    url.QueryEscape(email),
	}
	err := mailjetClient.Get(info, &contact)

	if err != nil {
    http.Error(w, "Cannot retrieve contact", http.StatusInternalServerError)
    return
	}

	jsonReponse, err := json.Marshal(contact)
	w.Write(jsonReponse)
}

func contactsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getContacts(w, r)
	case "POST":
		addContact(w, r)
	default:
		http.Error(w, "Wrong verb.", http.StatusNotFound)
		return
	}
}

func getContacts(w http.ResponseWriter, r *http.Request) {
	var contacts []resources.Contact
	_, _, err := mailjetClient.List("contact", &contacts, mailjet.Sort("CreatedAt", mailjet.SortDesc))

	if err != nil {
    http.Error(w, "Cannot retrieve contacts", http.StatusInternalServerError)
    return
	}

	jsonReponse, err := json.Marshal(contacts)
	w.Write(jsonReponse)
}

func addContact(w http.ResponseWriter, r *http.Request) {
	decoder := json.NewDecoder(r.Body)
	var data contact
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(w, "Cannot deserialize the entry.", http.StatusBadRequest)
		return
	}

	var contacts []resources.Contact
	fmr := &mailjet.FullRequest{
		Info: &mailjet.Request{Resource: "contact"},
		Payload: &resources.Contact{
			Email: data.Email,
			Name:  data.Name,
		},
	}
	err = mailjetClient.Post(fmr, contacts)

	if err != nil {
		msg := fmt.Sprintf("Could not create contact: %v", err)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
}
