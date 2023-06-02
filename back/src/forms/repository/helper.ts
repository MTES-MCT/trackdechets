import { UserInputError } from "apollo-server-core";
import { PackagingInfo } from "../../generated/graphql/types";

export function sumPackagingInfos(groupOfPackagingInfos: PackagingInfo[][]) {
  const types = new Set(
    groupOfPackagingInfos.flatMap(infos => infos.map(info => info.type))
  );
  if (types.size > 1 && (types.has("CITERNE") || types.has("BENNE"))) {
    throw new UserInputError(
      "Impossible de déclarer ce conditionnement sur l'annexe 1. Le bordereau chapeau a déjà des conditionnements déclarés qui sont incompatibles avec celui-ci."
    );
  }

  return groupOfPackagingInfos.reduce((sumOfPackagings, packagings) => {
    for (const packaging of packagings) {
      const alreadyExistingPackagingType = sumOfPackagings.find(
        p => p.type === packaging.type && packaging.type !== "AUTRE"
      );
      if (alreadyExistingPackagingType === undefined) {
        sumOfPackagings.push(packaging);
        continue;
      }

      const isCiterneOrBenne = ["CITERNE", "BENNE"].includes(packaging.type);
      if (isCiterneOrBenne) {
        // If one of the appendix has 2 bennes and the other have 1, we keep the 2.
        alreadyExistingPackagingType.quantity = Math.max(
          Math.min(2, alreadyExistingPackagingType.quantity),
          packaging.quantity
        );
      } else {
        alreadyExistingPackagingType.quantity += packaging.quantity;
      }
    }
    return sumOfPackagings;
  }, [] as PackagingInfo[]);
}
