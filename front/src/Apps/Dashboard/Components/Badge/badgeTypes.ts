import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdType } from "codegen-ui";

export interface BadgeProps {
  status: TBsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
  reviewStatus?: TBsdStatusCode | null;
  operationCode?: string;
}
