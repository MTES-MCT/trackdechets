package main

import (
	"net/url"
	"testing"
)

func TestBuildSearchURI(t *testing.T) {
	tables := []struct {
		x string
		y string
	}{
		{"clue=test", "/full_text/test"},
		{"clue=test&department=38", "/full_text/test?departement=38"},
		{"clue=test&department=38500", "/full_text/test?code_postal=38500"},
	}

	for _, table := range tables {
		parsedQueryString, _ := url.ParseQuery(table.x)
		result := buildSearchURI(parsedQueryString)

		decodedResult, _ := url.QueryUnescape(result)
		if decodedResult != table.y {
			t.Errorf("Search URI was incorrect, got: %s, want %s (input %s)", decodedResult, table.y, table.x)
		}
	}
}
