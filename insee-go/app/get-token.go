package main

import (
	"encoding/json"
	"io/ioutil"
	"os"
)

// TokenInfo Informations about the token given by INSEE
type TokenInfo struct {
	AccessToken string `json:"access_token"`
}

func getToken() string {
	jsonFile, err := os.Open("../cron/key.json")
	// if we os.Open returns an error then handle it
	if err != nil {
		panic(err)
	}
	byteValue, _ := ioutil.ReadAll(jsonFile)

	var tokenInfo TokenInfo
	json.Unmarshal(byteValue, &tokenInfo)

	return tokenInfo.AccessToken
}
