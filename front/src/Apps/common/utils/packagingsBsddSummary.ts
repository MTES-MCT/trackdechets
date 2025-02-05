import { FormInput, PackagingInfo, Packagings } from "@td/codegen-ui";
import { pluralize } from "@td/constants";

export const PACKAGINGS_NAMES = {
  [Packagings.Benne]: "Benne",
  [Packagings.Citerne]: "Citerne",
  [Packagings.Fut]: "Fût",
  [Packagings.Grv]: "GRV",
  [Packagings.Pipeline]: "Conditionné pour Pipeline",
  [Packagings.Autre]: "Autre"
};

// Renvoie un résumé des conditionnements de la forme suivante :
// 7 colis : 2 Fûts de 50 litres (n° cont1, cont2), 5 GRVs de 1 litre (n° GRV1, GRV2, GRV3)
export function getPackagingInfosSummary(packagingInfos: PackagingInfo[]) {
  const total = packagingInfos.reduce(
    (acc, packagingInfo) => acc + packagingInfo.quantity,
    0
  );
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
        summary += ` de ${packagingInfo.volume} ${volumeUnit}`;
      }

      if (packagingInfo.identificationNumbers) {
        summary += ` (n° ${packagingInfo.identificationNumbers.join(", ")})`;
      }

      return summary;
    })
    .join(", ");

  return formTransportIsPipeline({
    wasteDetails: {
      packagingInfos
    }
  })
    ? `${packages}`
    : `${total} colis : ${packages}`;
}

export const formTransportIsPipeline = (
  form: Pick<FormInput, "wasteDetails">
): boolean =>
  form.wasteDetails?.packagingInfos?.some(
    pkg => pkg.type === Packagings.Pipeline
  )!;
