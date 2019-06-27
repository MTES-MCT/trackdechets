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
var stmt *sql.Stmt
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

		stmt, err = db.Prepare(queryStr)

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

		err = stmt.QueryRow(siret).Scan(&icpe.CodeS3ic, &icpe.URLFiche)

		if err == sql.ErrNoRows {
			return nil, false
		} else if err != nil {
			log.Println(err)
			return nil, false
		}

		return &icpe, true
	}

	return nil, false
}
