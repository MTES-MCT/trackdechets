import { TBsdStatusCode } from "Apps/Common/types/bsdTypes";
import { BsdType } from "generated/graphql/types";

export interface BadgeProps {
  status: TBsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
}
