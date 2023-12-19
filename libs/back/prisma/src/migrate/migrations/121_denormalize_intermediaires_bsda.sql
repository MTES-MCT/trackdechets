-- postgres-migrations disable-transaction

DO
$do$
DECLARE status_list text[];
DECLARE current_status text;
BEGIN 
   status_list := '{"INITIAL", "SIGNED_BY_PRODUCER", "SIGNED_BY_WORKER", "PROCESSED", "REFUSED", "AWAITING_CHILD"}';
   FOREACH current_status IN ARRAY status_list LOOP
      UPDATE default$default."Bsda" AS f1
          SET "intermediariesOrgIds" =
            array(
              SELECT i."siret"
                FROM default$default."IntermediaryBsdaAssociation" AS i
                WHERE i."bsdaId" = f1.id AND i."siret" IS NOT NULL
              
              UNION
              
              SELECT j."vatNumber"
                FROM default$default."IntermediaryBsdaAssociation" AS j
                WHERE j."bsdaId" = f1.id AND j."vatNumber" IS NOT NULL
            )
          WHERE "status" = current_status::"default$default"."BsdaStatus";
   END LOOP;
END
$do$;
