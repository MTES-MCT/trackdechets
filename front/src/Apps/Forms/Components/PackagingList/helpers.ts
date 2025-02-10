import { PackagingInfoInput, Packagings } from "@td/codegen-ui";

export const emptyPackaging: PackagingInfoInput = {
  // On force le typage ici pour pouvoir afficher un champ
  // de formulaire vide tout en étant compatible avec l'input
  // PackagingInfoInput sur lequel `type` et `quantity` sont des champs requis.
  // Il faudra en revanche bien s'assurer d'utiliser la fonction
  // `cleanPackagings` ci-dessous avant d'envoyer les données à l'API
  // pour éviter des erreurs GraphQL.
  type: "" as Packagings,
  quantity: "" as any as number
};

/**
 * On souhaite que le formulaire de conditionnement s'affiche par défaut
 * avec un seul conditionnement dont tous les inputs sont vides. Pour ce faire
 * il suffit d'initialiser l'état du formulaire avec la valeur `[emptyPackaging]`.
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
export function cleanPackagings(packagings: PackagingInfoInput[]) {
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
