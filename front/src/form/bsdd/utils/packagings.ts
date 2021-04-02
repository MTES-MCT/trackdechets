import { PackagingInfo, Packagings } from "generated/graphql/types";

export const PACKAGINGS_NAMES = {
  [Packagings.Benne]: "Benne(s)",
  [Packagings.Citerne]: "Citerne(s)",
  [Packagings.Fut]: "Fût(s)",
  [Packagings.Grv]: "GRV(s)",
  [Packagings.Autre]: "Autre(s)",
};

export function getPackagingInfosSummary(packagingInfos: PackagingInfo[]) {
  const total = packagingInfos.reduce(
    (acc, packagingInfo) => acc + packagingInfo.quantity,
    0
  );
  const packages = packagingInfos
    .map(packagingInfo => {
      const name =
        packagingInfo.type === Packagings.Autre
          ? [
              PACKAGINGS_NAMES[Packagings.Autre],
              packagingInfo.other ? `(${packagingInfo.other})` : null,
            ]
              .filter(Boolean)
              .join(" ")
          : PACKAGINGS_NAMES[packagingInfo.type];
      return `${packagingInfo.quantity} ${name}`;
    })
    .join(", ");

  return `${total} colis : ${packages}`;
}
