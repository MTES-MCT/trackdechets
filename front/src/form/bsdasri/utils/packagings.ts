import {
  BsdasriPackaging,
  BsdasriPackagingType,
} from "generated/graphql/types";

export const PACKAGINGS_NAMES = {
  [BsdasriPackagingType.BoiteCarton]: "Caisse en carton avec sac en plastique",
  [BsdasriPackagingType.Fut]: "Fût(s)",
  [BsdasriPackagingType.BoitePerforants]:
    "Boîtes et Mini-collecteurs pour déchets perforants",

  [BsdasriPackagingType.GrandEmballage]: "Grand emballage",
  [BsdasriPackagingType.Grv]: "Grand récipient pour vrac",
  [BsdasriPackagingType.Autre]: "Autre(s)",
};

export function getDasriPackagingInfosSummary(packagings: BsdasriPackaging[]) {
  const total = packagings.reduce(
    (acc, packaging) => acc + packaging.quantity,
    0
  );

  const totalVolume = packagings.reduce(
    (acc, packaging) =>
      acc + (packaging.quantity ?? 0) * (packaging.volume ?? 0),
    0
  );
  const packages = packagings
    .map(packaging => {
      const name =
        packaging.type === BsdasriPackagingType.Autre
          ? [
              PACKAGINGS_NAMES[BsdasriPackagingType.Autre],
              packaging.other ? `(${packaging.other})` : null,
            ]
              .filter(Boolean)
              .join(" ")
          : PACKAGINGS_NAMES[packaging.type];
      return `${packaging.quantity} ${name}`;
    })
    .join(", ");

  return `${total} colis : ${packages} -  Volume Total: ${totalVolume} l`;
}
