import {
  BsdasriPackagingInfo,
  BsdasriPackagings,
} from "generated/graphql/types";

export const PACKAGINGS_NAMES = {
  [BsdasriPackagings.BoiteCarton]: "Caisse en carton avec sac en plastique",
  [BsdasriPackagings.Fut]: "Fût(s)",
  [BsdasriPackagings.BoitePerforants]:
    "Boîtes et Mini-collecteurs pour déchets perforants",

  [BsdasriPackagings.GrandEmballage]: "Grand emballage",
  [BsdasriPackagings.Grv]: "Grand récipient pour vrac",
  [BsdasriPackagings.Autre]: "Autre(s)",
};

export function getDasriPackagingInfosSummary(
  packagingInfos: BsdasriPackagingInfo[]
) {
  const total = packagingInfos.reduce(
    (acc, packagingInfo) => acc + packagingInfo.quantity,
    0
  );

  const totalVolume = packagingInfos.reduce(
    (acc, packagingInfo) =>
      acc + (packagingInfo.quantity ?? 0) * (packagingInfo.volume ?? 0),
    0
  );
  const packages = packagingInfos
    .map(packagingInfo => {
      const name =
        packagingInfo.type === BsdasriPackagings.Autre
          ? [
              PACKAGINGS_NAMES[BsdasriPackagings.Autre],
              packagingInfo.other ? `(${packagingInfo.other})` : null,
            ]
              .filter(Boolean)
              .join(" ")
          : PACKAGINGS_NAMES[packagingInfo.type];
      return `${packagingInfo.quantity} ${name}`;
    })
    .join(", ");

  return `${total} colis : ${packages} Volume Total: ${totalVolume} l`;
}
