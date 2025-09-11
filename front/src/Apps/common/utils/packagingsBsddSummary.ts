import {
  BsdaPackaging,
  BsdaPackagingType,
  PackagingInfo,
  Packagings
} from "@td/codegen-ui";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";
import { packagingTypeLabels } from "../../Forms/Components/PackagingList/helpers";

// Renvoie un résumé des conditionnements de la forme suivante :
// 7 colis : 2 Fûts de 50 litres (n° cont1, cont2), 5 GRVs de 1 litre (n° GRV1, GRV2, GRV3)
// expanded a besoin que l'élément ait le style whiteSpace: "pre-wrap" pour gérer les sauts de ligne
export function getPackagingInfosSummary<
  P extends PackagingInfo | BsdaPackaging
>(
  packagingInfos: P[],
  options?: { hideDetails?: boolean; expanded?: boolean }
) {
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
        packagingInfo.type === Packagings.Autre ||
        packagingInfo.type === BsdaPackagingType.Other
          ? [
              packagingTypeLabels[packagingInfo.type],
              packagingInfo.other ? `(${packagingInfo.other})` : null
            ]
              .filter(Boolean)
              .join(" ")
          : packagingTypeLabels[packagingInfo.type];

      let summary = !!options?.expanded ? "- " : "";

      summary += `${packagingInfo.quantity} ${pluralize(
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

      if (
        !options?.hideDetails &&
        packagingInfo.identificationNumbers?.length
      ) {
        summary += ` (n° ${packagingInfo.identificationNumbers.join(", ")})`;
      }

      return summary;
    })
    .join(!!options?.expanded ? "\n" : ", ");

  return !!options?.expanded
    ? `${total} colis :\n${packages}`
    : `${total} colis : ${packages}`;
}
