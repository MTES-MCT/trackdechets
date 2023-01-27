-- Fix all BSDDs
-- Set takenOverAt date to emittedAt
update "default$default"."Form"
set "takenOverAt" = "emittedAt"
where "emittedAt" > "takenOverAt";

-- Fix all BSVHUs
-- Set transporterTransportTakenOverAt date to emitterEmissionSignatureDate
update "default$default"."Bsvhu"
set "transporterTransportTakenOverAt" = "emitterEmissionSignatureDate"
where "emitterEmissionSignatureDate" > "transporterTransportTakenOverAt";