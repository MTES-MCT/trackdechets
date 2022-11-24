-- postgres-migrations disable-transaction

DO
$do$
DECLARE status_list text[];
DECLARE current_status text;
BEGIN 
   status_list := '{"DRAFT", "SEALED", "SIGNED_BY_PRODUCER", "SENT", "RECEIVED", "ACCEPTED", "PROCESSED", "AWAITING_GROUP", "GROUPED", "NO_TRACEABILITY", "REFUSED", "FOLLOWED_WITH_PNTTD", "TEMP_STORED", "TEMP_STORER_ACCEPTED", "RESEALED", "SIGNED_BY_TEMP_STORER", "RESENT"}';
   FOREACH current_status IN ARRAY status_list LOOP
      UPDATE default$default."Form" AS f1
          SET "recipientsSirets" =
            array(SELECT f2."recipientCompanySiret"
              FROM default$default."Form" AS f2
              WHERE f2.id = f1."forwardedInId" AND f2."recipientCompanySiret" IS NOT NULL
              UNION SELECT f1."recipientCompanySiret" WHERE f1."recipientCompanySiret" IS NOT NULL
            )
          WHERE "status" = current_status::"default$default"."Status";
   END LOOP;
END
$do$;
