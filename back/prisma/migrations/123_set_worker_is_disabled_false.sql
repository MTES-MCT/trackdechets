UPDATE
	"default$default"."Bsda"
SET
	"workerIsDisabled" = false
WHERE
	"workerIsDisabled" IS NULL
	AND "workerCompanySiret" IS NOT NULL
	AND "workerCompanySiret" <> '';