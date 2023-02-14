import { PackagingInfo } from "../../generated/graphql/types";

export function sumPackagingInfos(groupOfPackagingInfos: PackagingInfo[][]) {
  return groupOfPackagingInfos.reduce((sumOfPackagings, packagings) => {
    for (const packaging of packagings) {
      const alreadyExistingPackagingType = sumOfPackagings.find(
        p => p.type === packaging.type
      );
      if (alreadyExistingPackagingType && packaging.type !== "AUTRE") {
        alreadyExistingPackagingType.quantity += packaging.quantity;
      } else {
        sumOfPackagings.push(packaging);
      }
    }
    return sumOfPackagings;
  }, [] as PackagingInfo[]);
}
