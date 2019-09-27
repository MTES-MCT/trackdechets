package main

import (
	"errors"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httputil"
	"time"
)

const (
	baseSireneURL = "https://entreprise.data.gouv.fr/api/sirene/v1"
)

// Client - Http client to entreprise.data.gouv.fr
type Client struct {
	httpClient *http.Client
}

func (client *Client) queryAPI(uri string) ([]byte, error) {
	req, err := http.NewRequest("GET", baseSireneURL+uri, nil)

	req.Header.Add("Accept", `application/json`)

	resp, err := client.httpClient.Do(req)

	if err != nil {
		log.Println("Technical error while querying API", err)
		return nil, errors.New("Request failed - Technical error")
	}

	if resp.StatusCode != 200 {
		log.Println("Error while querying SIRENE API, received status code", resp.StatusCode, http.StatusText(resp.StatusCode))

		requestDump, _ := httputil.DumpRequest(req, true)
		log.Println("Dumping error content...", string(requestDump))

		responseData, _ := ioutil.ReadAll(resp.Body)
		return nil, errors.New(string(responseData))
	}

	responseData, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Println("Technical error while reading API result", err)
		return nil, errors.New("Request failed - Could not read response")
	}

	return responseData, nil
}

func newClient(options ...func(*Client)) *Client {
	cli := Client{
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}

	for i := range options {
		options[i](&cli)
	}

	return &cli
}
