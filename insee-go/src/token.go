package main

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/robfig/cron"
)

// TokenInfo Informations about the token given by INSEE
type TokenInfo struct {
	AccessToken string `json:"access_token"`
}

func readToken() string {
	jsonFile, err := os.Open("./key.json")
	check(err)
	byteValue, err := ioutil.ReadAll(jsonFile)
	check(err)

	var tokenInfo TokenInfo
	json.Unmarshal(byteValue, &tokenInfo)

	return tokenInfo.AccessToken
}

func generateToken() {
	// Generate a first token on startup
	generateTokenFromInsee()

	// Then setup the CRON task that renew it every day at midnight
	c := cron.New()
	c.AddFunc("@midnight", generateTokenFromInsee)

	c.Start()
}

func generateTokenFromInsee() {
	body := strings.NewReader(`grant_type=client_credentials`)
	req, err := http.NewRequest("POST", "https://api.insee.fr/token", body)
	check(err)

	req.Header.Set("Authorization", "Basic "+os.Getenv("INSEE_SECRET"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

  // Ingnore certificate check (cf `curl -k`)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}
	resp, err := client.Do(req)
	check(err)

	responseData, err := ioutil.ReadAll(resp.Body)
	err = ioutil.WriteFile("key.json", responseData, 0644)
	check(err)

	fmt.Printf("INSEE token updated at %s\n", time.Now().Format(time.RFC822))
}
