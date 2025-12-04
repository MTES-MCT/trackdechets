import {
  BsdaPackagingInput,
  BsdaPackagingType,
  PackagingInfoInput,
  Packagings
} from "@td/codegen-ui";

export const emptyBsddPackaging: PackagingInfoInput = {
  // On force le typage ici pour pouvoir afficher un champ
  // de formulaire vide tout en étant compatible avec l'input
  // PackagingInfoInput sur lequel `type` et `quantity` sont des champs requis.
  // Il faudra en revanche bien s'assurer d'utiliser la fonction
  // `cleanPackagings` ci-dessous avant d'envoyer les données à l'API
  // pour éviter des erreurs GraphQL.
  type: "" as Packagings,
  quantity: "" as any as number
};

export const emptyBsdaPackaging: BsdaPackagingInput = {
  type: "" as BsdaPackagingType,
  quantity: null as any as number
};

/**
 * On souhaite que le formulaire de conditionnement s'affiche par défaut
 * avec un seul conditionnement dont tous les inputs sont vides. Pour ce faire
 * il suffit d'initialiser l'état du formulaire avec la valeur `[emptyBsddPackaging]`
 * ou `[emptyBsdaPackaging]`.
 * Le problème est que si l'utilisateur essaye d'enregistrer le formulaire sans
 * avoir modifier les conditionnements on prend les erreurs suivantes :
 *
 * Variable "$input" got invalid value "" at "input.packagingInfos[0].type"; Value
 * "" does not exist in "Packagings" enum.
 *
 * Variable "$input" got invalid value "" at "input.packagingInfos[0].quantity";
 * Int cannot represent non-integer value: ""
 *
 * Variable "$updateFormInput" got invalid value "" at "input.packagingInfos[0].volume";
 * Float cannot represent non numeric value: ""
 *
 * Il est donc nécessaire de nettoyer les données avant de les envoyer au serveur
 */
export function cleanPackagings<
  P extends PackagingInfoInput | BsdaPackagingInput
>(packagings: P[]) {
  return packagings
    .filter(
      // Supprime le conditionnement vide par défaut ajouté dans l'état initial
      // si celui-ci n'a pas été complété.
      p => !!p.type
    )
    .map(p => ({
      ...p,
      // Convertit "" vers 0 dans le cas où l'input est laissé vide
      // car le champ `quantity` est requis sur PackagingInfoInput
      quantity: Number(p.quantity),
      // Convertit "" vers null dans le cas où l'input est laissé vide
      volume: (p.volume as any) === "" ? null : p.volume
    }));
}

export const bsddPackagingTypes = [
  Packagings.Benne,
  Packagings.Citerne,
  Packagings.Fut,
  Packagings.Grv,
  Packagings.Autre
];

export const bsdaPackagingTypes = [
  BsdaPackagingType.BigBag,
  BsdaPackagingType.ConteneurBag,
  BsdaPackagingType.DepotBag,
  BsdaPackagingType.PaletteFilme,
  BsdaPackagingType.SacRenforce,
  BsdaPackagingType.Other
];

export const packagingTypeLabels: Record<
  Packagings | BsdaPackagingType,
  string
> = {
  [Packagings.Benne]: "Benne",
  [Packagings.Citerne]: "Citerne",
  [Packagings.Fut]: "Fût",
  [Packagings.Grv]: "Grand Récipient Vrac (GRV)",
  [Packagings.Autre]: "Autre",
  [Packagings.Pipeline]: "Pipeline",
  [BsdaPackagingType.BigBag]: "Big Bag / GRV",
  [BsdaPackagingType.ConteneurBag]: "Conteneur-bag",
  [BsdaPackagingType.DepotBag]: "Dépôt-bag",
  [BsdaPackagingType.PaletteFilme]: "Palette filmée",
  [BsdaPackagingType.SacRenforce]: "Sac renforcé",
  [BsdaPackagingType.Other]: "Autre"
};
