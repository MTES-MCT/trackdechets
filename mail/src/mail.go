package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	mailjet "github.com/mailjet/mailjet-apiv3-go"
)

type mail struct {
	ToEmail string `json:"toEmail"`
	ToName  string `json:"toName"`
	Subject string `json:"subject"`
	Title   string `json:"title"`
	Body    string `json:"body"`
}

var mailjetClient = mailjet.NewMailjetClient(
	mustGetenv("MJ_APIKEY_PUBLIC"),
	mustGetenv("MJ_APIKEY_PRIVATE"),
)

func mustGetenv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		log.Fatalf("%s environment variable not set.", k)
	}
	return v
}

func main() {
	http.HandleFunc("/send", sendEmail)
	log.Fatal(http.ListenAndServe(":80", nil))
}

func sendEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Enpoint accessible uniquement en POST.", http.StatusNotFound)
		return
	}

	decoder := json.NewDecoder(r.Body)
	var data mail
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(w, "Impossible de déséréaliser l'entrée.", http.StatusBadRequest)
		return
	}

	if data.Body == "" || data.Subject == "" || data.Title == "" || data.ToEmail == "" || data.ToName == "" {
		msg := fmt.Sprintf("Données manquantes: %v", data)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	messagesInfo := []mailjet.InfoMessagesV31{
		mailjet.InfoMessagesV31{
			From: &mailjet.RecipientV31{
				Email: "orion.charlier@beta.gouv.fr",
				Name:  "Noreply Trackdéchets",
			},
			To: &mailjet.RecipientsV31{
				mailjet.RecipientV31{
					Email: data.ToEmail,
					Name:  data.ToName,
				},
			},
			Subject:          data.Subject,
			TemplateID:       647957,
			TemplateLanguage: true,
			Variables: map[string]interface{}{
				"subject": data.Subject,
				"title":   data.Title,
				"body":    data.Body,
			},
		},
	}
	messages := mailjet.MessagesV31{Info: messagesInfo}
	res, err := mailjetClient.SendMailV31(&messages)
	if err != nil {
		msg := fmt.Sprintf("Could not send mail: %v", err)
		http.Error(w, msg, 500)
		return
	}
	fmt.Printf("Data: %+v\n", res)
}
