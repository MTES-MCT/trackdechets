import {
  BsdasriPackaging,
  BsdasriPackagingType,
  Packagings,
  PackagingInfo,
  FormInput,
  BsdaPackagingType
} from "@td/codegen-ui";
import { Decimal } from "decimal.js";
import { BsdTypename } from "../../../../../../common/types/bsdTypes";

export const PACKAGINGS_BSD_NAMES = {
  [BsdTypename.Bsdasri]: {
    [BsdasriPackagingType.BoiteCarton]:
      "Caisse(s) en carton avec sac en plastique",
    [BsdasriPackagingType.Fut]: "Fût(s)",
    [BsdasriPackagingType.BoitePerforants]:
      "Boîte(s) et Mini-collecteurs pour déchets perforants",

    [BsdasriPackagingType.GrandEmballage]: "Grand(s) emballage(s)",
    [BsdasriPackagingType.Grv]: "Grand(s) récipient(s) pour vrac",
    [BsdasriPackagingType.Autre]: "Autre(s)"
  },
  [BsdTypename.Bsdd]: {
    [Packagings.Benne]: "Benne(s)",
    [Packagings.Citerne]: "Citerne(s)",
    [Packagings.Fut]: "Fût(s)",
    [Packagings.Grv]: "GRV(s)",
    [Packagings.Autre]: "Autre(s)"
  },
  [BsdTypename.Bsda]: {
    [BsdaPackagingType.BigBag]: "Big-bag / GRV",
    [BsdaPackagingType.DepotBag]: "Dépôt-bag",
    [BsdaPackagingType.PaletteFilme]: "Palette filmée",
    [BsdaPackagingType.SacRenforce]: "Sac renforcé",
    [BsdaPackagingType.ConteneurBag]: "Conteneur-bag",
    [BsdaPackagingType.Other]: "Autre(s)"
  }
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
    .map(
      type =>
        `${quantityByType[type]} ${
          PACKAGINGS_BSD_NAMES[BsdTypename.Bsdasri][type]
        }`
    )
    .join(", ");

  return `${total} colis : ${packages} -  Volume Total: ${totalVolume} l`;
}

export function getBsddPackagingInfosSummary(packagingInfos: PackagingInfo[]) {
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
              PACKAGINGS_BSD_NAMES[BsdTypename.Bsdd][Packagings.Autre],
              packagingInfo.other ? `(${packagingInfo.other})` : null
            ]
              .filter(Boolean)
              .join(" ")
          : PACKAGINGS_BSD_NAMES[BsdTypename.Bsdd][packagingInfo.type];
      return `${packagingInfo.quantity} ${name}`;
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
