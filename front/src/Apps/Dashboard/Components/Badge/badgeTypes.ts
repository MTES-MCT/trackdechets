import { BsdStatusCode } from "common/types/bsdTypes";
import { BsdType } from "generated/graphql/types";

export interface BadgeProps {
  status: BsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
  isSmall?: boolean;
}
