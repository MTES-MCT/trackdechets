import { TBsdStatusCode } from "Apps/common/types/bsdTypes";
import { BsdType } from "generated/graphql/types";

export interface BadgeProps {
  status: TBsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
  reviewStatus?: TBsdStatusCode | null;
  operationCode?: string;
}
