import { InitialFormFraction, PackagingInfo } from "@td/codegen-ui";

// Permet de regrouper les conditionnements présents sur les annexes 2 par type, volume et other.
// Exemple avec les annexes 2 et les conditionnements suivants :
// - Première annexe : 2 fûts de 20L (n° A, B) et 1 fût de 30L (n° C)
// - Deuxième annexe : 1 GRV de 30L (n°D) et 3 fûts de 20L (n°E, F, G)
// On veut renvoyer 5 fûts de 20L (n°A, B, E, F, G), 1 fût de 30L (n°C) et 1 GRV de 30L (n°D)
// avec les quantités et les numéros d'identifications qui ont été regroupés par type et par volume
export function totalPackagings(
  annexedForms: InitialFormFraction[]
): PackagingInfo[] {
  const packagingMap: { [key: string]: PackagingInfo } = {};

  for (const { form, quantity } of annexedForms) {
    if (form.wasteDetails?.packagingInfos?.length && quantity) {
      for (const packagingInfo of form.wasteDetails.packagingInfos) {
        const { type, volume, other, quantity, identificationNumbers } =
          packagingInfo;

        const mapKey = `${type}-${volume ?? "0"}-${other ?? ""}`;

        const existingValue = packagingMap[mapKey];

        if (existingValue) {
          packagingMap[mapKey].quantity += quantity;
          packagingMap[mapKey].identificationNumbers.push(
            ...identificationNumbers
          );
        } else {
          packagingMap[mapKey] = {
            type,
            volume,
            other,
            quantity,
            identificationNumbers: [...identificationNumbers]
          };
        }
      }
    }
  }

  return Object.values(packagingMap);
}
