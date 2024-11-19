import { EmptyReturnAdr } from "@td/codegen-ui";

export const EMPTY_RETURN_ADR_REASON = {
  [EmptyReturnAdr.EmptyCiterne]:
    "Véhicule-Citerne vide, dernière marchandise chargée",
  [EmptyReturnAdr.EmptyReturnNotWashed]: "Retour à vide, non nettoyé",
  [EmptyReturnAdr.EmptyVehicle]: "Véhicule vide, dernière marchandise chargée",
  [EmptyReturnAdr.EmptyContainer]:
    "Conteneur vide, dernière marchandise chargée",
  [EmptyReturnAdr.EmptyCiterneContainer]:
    "Conteneur-citerne vide, dernière marchandise chargée"
};
