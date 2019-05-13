package main

import (
	"net/url"
	"testing"
)

func TestBuildSearchParams(t *testing.T) {
	tables := []struct {
		x string
		y string
	}{
		{"clue=test", `nombre=7&q=denominationUniteLegale:"test"`},
		{"clue=test&department=38", `nombre=7&q=denominationUniteLegale:"test" AND codePostalEtablissement:38*`},
		{"clue=test&department=38500", `nombre=7&q=denominationUniteLegale:"test" AND codePostalEtablissement:38500`},
	}

	for _, table := range tables {
		parsedQueryString, _ := url.ParseQuery(table.x)
    result := buildSearchParams(parsedQueryString)

    decodedResult, _ := url.QueryUnescape(result)
		if decodedResult != table.y {
			t.Errorf("Search URI was incorrect, got: %s, want %s (input %s)", decodedResult, table.y, table.x)
		}
	}
}
