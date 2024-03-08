import { BsdasriPackaging, BsdasriPackagingType } from "@td/codegen-ui";
import { Decimal } from "decimal.js";

export const PACKAGINGS_NAMES = {
  [BsdasriPackagingType.BoiteCarton]:
    "Caisse(s) en carton avec sac en plastique",
  [BsdasriPackagingType.Fut]: "Fût(s)",
  [BsdasriPackagingType.BoitePerforants]:
    "Boîte(s) et Mini-collecteurs pour déchets perforants",

  [BsdasriPackagingType.GrandEmballage]: "Grand(s) emballage(s)",
  [BsdasriPackagingType.Grv]: "Grand(s) récipient(s) pour vrac",
  [BsdasriPackagingType.Autre]: "Autre(s)"
};

export function getDasriPackagingInfosSummary(packagings: BsdasriPackaging[]) {
  const total = packagings.reduce(
    (acc, packaging) => acc + packaging.quantity,
    0
  );

  const totalVolume = packagings.reduce(
    (acc, packaging) =>
      acc.plus((packaging.quantity ?? 0) * (packaging.volume ?? 0)),
    new Decimal(0)
  );

  const quantityByType = packagings.reduce((acc, packaging) => {
    if (acc[packaging.type] > 0) {
      return {
        ...acc,
        [packaging.type]: packaging.quantity + acc[packaging.type]
      };
    }
    return {
      ...acc,
      [packaging.type]: packaging.quantity
    };
  }, {});

  const packages = Object.keys(quantityByType)
    .map(type => `${quantityByType[type]} ${PACKAGINGS_NAMES[type]}`)
    .join(", ");

  return `${total} colis : ${packages} -  Volume Total: ${totalVolume} l`;
}
