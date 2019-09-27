package main

import (
	"bytes"
	"io/ioutil"
	"net/http"
	"testing"
)

const (
	okResponse = `{
		"response": "Anything here"
  }`
	koResponse = `{
    "message": "no results found"
  }`
)

func TestQueryApi(t *testing.T) {
	getCli := func(response *http.Response) *Client {
		httpClient := NewTestClient(func(req *http.Request) *http.Response {
			return response
		})
		cli := newClient()
		cli.httpClient = httpClient
		return cli
	}

	t.Run("returns 404 when SIRET does not exist", func(t *testing.T) {
    cli := getCli(&http.Response{
      StatusCode: http.StatusNotFound,
      Body:       ioutil.NopCloser(bytes.NewBufferString(koResponse)),
      Header: make(http.Header),
    })

		_, got := cli.queryAPI("not a SIRET")
		want := koResponse

		if got.Error() != want {
			t.Errorf("got %v want %v", got, want)
		}
	})

	t.Run("returns response when SIRET exists", func(t *testing.T) {
    cli := getCli(&http.Response{
      StatusCode: 200,
      Body:       ioutil.NopCloser(bytes.NewBufferString(okResponse)),
      Header: make(http.Header),
    })

		gotAsBytes, _ := cli.queryAPI("not a SIRET")
    got := string(gotAsBytes[:])
    want := okResponse

		if got != want {
			t.Errorf("got %v want %v", got, want)
		}
	})
}

// RoundTripFunc .
type RoundTripFunc func(req *http.Request) *http.Response

// RoundTrip .
func (f RoundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req), nil
}

//NewTestClient returns *http.Client with Transport replaced to avoid making real calls
func NewTestClient(fn RoundTripFunc) *http.Client {
	return &http.Client{
		Transport: RoundTripFunc(fn),
	}
}
