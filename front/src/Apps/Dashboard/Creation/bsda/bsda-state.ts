import {
  BsdaTransporterInput,
} from "@td/codegen-ui";

// Les données transporteurs du formulaire représente soit un transporteur BSDA
// déjà crée en base de données qui dispose d'un identifiant, soit un transporteur
// non encore crée en base ne disposant pas encore d'identifiant. Par ailleurs on a
// besoin de connaitre la valeur de `takenOverAt` pour l'affichage des infos transporteur
// en mode formulaire ou statique dans la liste.
export type CreateOrUpdateBsdaTransporterInput = BsdaTransporterInput & {
  id?: string | null;
  takenOverAt?: string | null;
};