UPDATE
  "default$default"."Bsff"
SET
  "transporterTransportPlates" = '{XX-XXX-XX}'
WHERE
  (
    "transporterTransportPlates" IS NULL
    OR "transporterTransportPlates" = '{}'
  )
  AND "status" in (
    'SENT' :: "default$default"."BsffStatus",
    'RECEIVED' :: "default$default"."BsffStatus",
    'ACCEPTED' :: "default$default"."BsffStatus",
    'PARTIALLY_REFUSED' :: "default$default"."BsffStatus"
  );

UPDATE
  "default$default"."Bsda"
SET
  "transporterTransportPlates" = '{XX-XXX-XX}'
WHERE
  (
    "transporterTransportPlates" IS NULL
    OR "transporterTransportPlates" = '{}'
  )
  AND "status" in ('SENT' :: "default$default"."BsdaStatus");