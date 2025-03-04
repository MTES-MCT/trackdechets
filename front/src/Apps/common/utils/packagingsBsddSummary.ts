import { PackagingInfo, Packagings } from "@td/codegen-ui";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";

export const PACKAGINGS_NAMES = {
  [Packagings.Benne]: "Benne",
  [Packagings.Citerne]: "Citerne",
  [Packagings.Fut]: "Fût",
  [Packagings.Grv]: "GRV",
  [Packagings.Autre]: "Autre"
};

// Renvoie un résumé des conditionnements de la forme suivante :
// 7 colis : 2 Fûts de 50 litres (n° cont1, cont2), 5 GRVs de 1 litre (n° GRV1, GRV2, GRV3)
export function getPackagingInfosSummary(packagingInfos: PackagingInfo[]) {
  const total = packagingInfos.reduce(
    (acc, packagingInfo) => acc + packagingInfo.quantity,
    0
  );

  if (total === 0) {
    return "";
  }

  const packages = [...packagingInfos]
    .sort((p1, p2) => p1.type.localeCompare(p2.type))
    .map(packagingInfo => {
      const name =
        packagingInfo.type === Packagings.Autre
          ? [
              PACKAGINGS_NAMES[Packagings.Autre],
              packagingInfo.other ? `(${packagingInfo.other})` : null
            ]
              .filter(Boolean)
              .join(" ")
          : PACKAGINGS_NAMES[packagingInfo.type];

      let summary = `${packagingInfo.quantity} ${pluralize(
        name,
        packagingInfo.quantity
      )}`;

      if (packagingInfo.volume) {
        const volumeUnit =
          packagingInfo.type === Packagings.Benne
            ? "m3"
            : pluralize("litre", packagingInfo.volume);
        const volumeValue =
          packagingInfo.type === Packagings.Benne
            ? new Decimal(packagingInfo.volume).dividedBy(1000).toNumber()
            : packagingInfo.volume;
        summary += ` de ${volumeValue} ${volumeUnit}`;
      }

      if (packagingInfo.identificationNumbers?.length) {
        summary += ` (n° ${packagingInfo.identificationNumbers.join(", ")})`;
      }

      return summary;
    })
    .join(", ");

  return `${total} colis : ${packages}`;
}
