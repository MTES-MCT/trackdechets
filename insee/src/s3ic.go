package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB
var stmt1 *sql.Stmt
var stmt2 *sql.Stmt
var ready = false

func ping() bool {
	for {
		err := db.Ping()
		if err == nil {
			return true
		}
		time.Sleep(1 * time.Second)
	}
}

func connectionFailed() {
	log.Println("Failed establishing a connection")
}

func init() {

	var err error

	connStr := fmt.Sprintf(`
		user=%s
		password=%s
		host=postgres
		dbname=etl
		sslmode=disable`,
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"))

	db, err = sql.Open("postgres", connStr)

	if err != nil {
		connectionFailed()
		return
	}

	connected := make(chan bool)

	go func() { connected <- ping() }()

	timeout := time.After(10 * time.Second)

	select {
	case <-timeout:
		connectionFailed()
		return
	case <-connected:

		queryStr := `
			SELECT
				code_s3ic as codeS3ic,
				url_fiche as urlFiche
			FROM etl.s3ic_consolidated
			WHERE num_siret = $1
			OR irep_numero_siret = $1`

		stmt1, err = db.Prepare(queryStr)

		if err != nil {
			connectionFailed()
			return
		}

		queryStr = `
			SELECT
				rubrique,
				regime_autorise as regimeAutorise,
				activite
			FROM etl.rubriques_prepared
			WHERE code_s3ic = $1
			AND etat_activite = 'En fonct.'
		`

		stmt2, err = db.Prepare(queryStr)

		if err != nil {
			connectionFailed()
			return
		}

		log.Println("Connection to postgres ready")
		ready = true
	}

}

// GetICPE retourne l'ICPE associée à un siret
func GetICPE(siret string) (*ICPE, bool) {

	var err error

	if ready {

		var icpe ICPE

		err = stmt1.QueryRow(siret).Scan(&icpe.CodeS3ic, &icpe.URLFiche)

		if err == sql.ErrNoRows {
			return nil, false
		} else if err != nil {
			log.Println(err)
			return nil, false
		}

		rows, err := stmt2.Query(icpe.CodeS3ic)

		defer rows.Close()

		if err != nil {
			log.Println(err)
			return &icpe, true
		}

		rubriques := make([]Rubrique, 0)

		for rows.Next() {
			rubrique := new(Rubrique)
			rows.Scan(
				&rubrique.Rubrique,
				&rubrique.RegimeAutorise,
				&rubrique.Activite)
			rubriques = append(rubriques, *rubrique)
		}

		if err = rows.Err(); err != nil {
			log.Println(err)
			return &icpe, true
		}

		icpe.Rubriques = rubriques

		return &icpe, true
	}

	return nil, false
}
