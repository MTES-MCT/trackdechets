import {
  BsffPackaging,
  BsffPackagingType,
  PackagingInfo,
  Packagings
} from "@td/codegen-ui";
import { pluralize } from "@td/constants";
import Decimal from "decimal.js";
import { packagingTypeLabels } from "../../Forms/Components/PackagingList/helpers";

export function getPackagingInfosSummary<P extends BsffPackaging>(
  packagingInfos: P[],
  options?: { hideDetails?: boolean; expanded?: boolean }
) {
  const total = packagingInfos.length;

  if (total === 0) {
    return "";
  }

  const packages = [...packagingInfos]
    .sort((p1, p2) => p1.type.localeCompare(p2.type))
    .map(packagingInfo => {
      const name =
        packagingInfo.type === BsffPackagingType.Autre
          ? [
              packagingTypeLabels[packagingInfo.type],
              packagingInfo.other ? `(${packagingInfo.other})` : null
            ]
              .filter(Boolean)
              .join(" ")
          : packagingTypeLabels[packagingInfo.type];

      let summary = !!options?.expanded ? "- " : "";

      summary += name;

      if (packagingInfo.volume) {
        const volumeUnit = pluralize("litre", packagingInfo.volume);
        const volumeValue = packagingInfo.volume;
        summary += ` de ${volumeValue} ${volumeUnit}`;
      }

      if (!options?.hideDetails && packagingInfo.numero) {
        summary += ` (n° ${packagingInfo.numero})`;
      }

      return summary;
    })
    .join(!!options?.expanded ? "\n" : ", ");

  return !!options?.expanded
    ? `${total} colis :\n${packages}`
    : `${total} colis : ${packages}`;
}
