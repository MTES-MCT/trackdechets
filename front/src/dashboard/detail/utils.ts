import { CommonBsdStatus } from "generated/graphql/types";

// Type predicate to allow "casting" BsffStatus to CommonBsdStatus
export function isCommonBsdStatus(value: any): value is CommonBsdStatus {
  return Object.values(CommonBsdStatus).indexOf(value) > -1;
}
