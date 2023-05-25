import { PackagingInfo } from "../../generated/graphql/types";

export function sumPackagingInfos(groupOfPackagingInfos: PackagingInfo[][]) {
  return groupOfPackagingInfos.reduce((sumOfPackagings, packagings) => {
    for (const packaging of packagings) {
      const alreadyExistingPackagingType = sumOfPackagings.find(
        p => p.type === packaging.type && packaging.type !== "AUTRE"
      );
      if (alreadyExistingPackagingType) {
        const isCiterneOrBenne = ["CITERNE", "BENNE"].includes(packaging.type);
        if (isCiterneOrBenne) {
          // If one of the appendix has 2 bennes and the other have 1, we keep the 2.
          alreadyExistingPackagingType.quantity = Math.max(
            alreadyExistingPackagingType.quantity,
            packaging.quantity
          );
        } else {
          alreadyExistingPackagingType.quantity += packaging.quantity;
        }
      } else {
        sumOfPackagings.push(packaging);
      }
    }
    return sumOfPackagings;
  }, [] as PackagingInfo[]);
}
