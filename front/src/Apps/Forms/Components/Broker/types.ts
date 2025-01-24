// Le composant Broker est commun à tous les types de bordereaux
// On choisit arbitrairement un type de bordereau comme réferentiel
// commun et on s'assurera de convertir les données dans un sens et
// dans l'autre lorsque ce composant est utilisé sur un autre type de

import { BsdaBrokerInput } from "@td/codegen-ui";

// bordereau (ex: BSDD)
export type CommonBrokerInput = BsdaBrokerInput;
