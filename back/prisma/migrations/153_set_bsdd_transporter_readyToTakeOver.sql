-- S'assure que le champ `readyToTakeOver` est à true pour tous 
-- les transporteurs n°1 car on vérifie désormais la valeur de ce paramètre 
-- dans la mutation `signTransportForm` 
UPDATE
  "default$default"."BsddTransporter"
SET
  "readyToTakeOver" = true
WHERE
  "number" = 1