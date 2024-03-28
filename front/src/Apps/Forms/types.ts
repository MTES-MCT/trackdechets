import { BsdaTransporterInput } from "@td/codegen-ui";
import { CreateOrUpdateTransporterInput } from "../../form/bsdd/utils/initial-state";
import { CreateOrUpdateBsdaTransporterInput } from "../../form/bsda/stepper/initial-state";

// On veut pouvoir utiliser le formulaire transporteurs pour tous les types de bordereau.
// Cela nécessite donc de définir une structure de données commune
// à tous les transporteurs. Plutôt que de re-créer un type Transporteur à partir de 0, on choisit
// arbitrairement le transporteur BSDA comme base commune.
export type BsdTransporterInput = BsdaTransporterInput & {
  // identifiant du bordereau en cas d'update
  id?: string | null;
  // date de prise en charge par le transporteur
  takenOverAt?: string | null;
};

export type AnyTransporterInput =
  | CreateOrUpdateTransporterInput
  | CreateOrUpdateBsdaTransporterInput;
