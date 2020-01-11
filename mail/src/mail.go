package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	mailjet "github.com/mailjet/mailjet-apiv3-go"
)

type mailAttachment struct {
	File string `json:"file"`
	Name string `json:"name"`
}

type mail struct {
	TemplateID int64                  `json:"templateId"`
	To         []recipient            `json:"to"`
	Cc         []recipient            `json:"cc"`
	Subject    string                 `json:"subject"`
	Title      string                 `json:"title"`
	Body       string                 `json:"body"`
	BaseURL    string                 `json:"baseUrl"`
	Attachment mailAttachment         `json:"attachment"`
	Vars       map[string]interface{} `json:"vars"`
}

type recipient struct {
	Email string `json:",omitempty"`
	Name  string `json:",omitempty"`
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
	http.HandleFunc("/ping", pong)
	http.HandleFunc("/send", sendEmail)
	http.HandleFunc("/contact/", singleContactHandler)
	http.HandleFunc("/contact", contactsHandler)
	log.Fatal(http.ListenAndServe(":80", nil))
}

func pong(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("Pong"))
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

	if data.Body == "" || data.Subject == "" || data.Title == "" || data.ToEmail == "" || data.ToName == "" || data.TemplateID == 0 {
		msg := fmt.Sprintf("Données manquantes: %v", data)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	Variables := map[string]interface{}{
		"subject": data.Subject,
		"title":   data.Title,
		"body":    data.Body,
		"baseurl": data.BaseURL,
	}

	// Merge pre-defined variables with dynamic variables
	for k, v := range data.Vars {
		Variables[k] = v
	}

	messagesInfoParams := mailjet.InfoMessagesV31{
		From: &mailjet.RecipientV31{
			Email: "noreply@trackdechets.fr",
			Name:  "Noreply Trackdéchets",
		},
		To:               getAsMailjetRecipients(data.To),
		Cc:               getAsMailjetRecipients(data.Cc),
		Subject:          data.Subject,
		TemplateID:       data.TemplateID,
		TemplateLanguage: true,
		Variables:        Variables,
	}

	if (data.Attachment.File != "") && (data.Attachment.Name != "") {
		messagesInfoParams.Attachments = &mailjet.AttachmentsV31{
			mailjet.AttachmentV31{
				ContentType:   "application/pdf",
				Filename:      data.Attachment.Name,
				Base64Content: data.Attachment.File,
			},
		}
	}

	messagesInfo := []mailjet.InfoMessagesV31{
		messagesInfoParams,
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

func getAsMailjetRecipients(recipients []recipient) *mailjet.RecipientsV31 {
	var mjRecipients mailjet.RecipientsV31
	for _, recipient := range recipients {
		mjRecipients = append(mjRecipients, mailjet.RecipientV31{
			Email: recipient.Email,
			Name:  recipient.Name,
		})
	}

	return &mjRecipients
}
