import { BsdaPackaging, PackagingInfo } from "@td/codegen-ui";

// Permet de regrouper les conditionnements présents dans un regroupement par type, volume et other.
// Exemple avec les annexes 2 et les conditionnements suivants :
// - Première annexe : 2 fûts de 20L (n° A, B) et 1 fût de 30L (n° C)
// - Deuxième annexe : 1 GRV de 30L (n°D) et 3 fûts de 20L (n°E, F, G)
// On veut renvoyer 5 fûts de 20L (n°A, B, E, F, G), 1 fût de 30L (n°C) et 1 GRV de 30L (n°D)
// avec les quantités et les numéros d'identifications qui ont été regroupés par type et par volume

export function mergePackagings<P extends PackagingInfo | BsdaPackaging>(
  packagings: P[]
): P[] {
  const packagingMap: { [key: string]: P } = {};

  for (const packaging of packagings) {
    const { type, volume, other, quantity, identificationNumbers } = packaging;

    const mapKey = `${type}-${volume ?? "0"}-${other ?? ""}`;

    const existingValue = packagingMap[mapKey];

    if (existingValue) {
      packagingMap[mapKey].quantity += quantity;
      packagingMap[mapKey].identificationNumbers.push(...identificationNumbers);
    } else {
      packagingMap[mapKey] = {
        type,
        volume,
        other,
        quantity,
        identificationNumbers: [...identificationNumbers]
      } as P;
    }
  }

  return Object.values(packagingMap);
}
