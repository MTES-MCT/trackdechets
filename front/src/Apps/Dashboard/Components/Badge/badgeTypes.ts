import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdType, Transporter } from "@td/codegen-ui";

export interface BadgeProps {
  status: TBsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
  reviewStatus?: TBsdStatusCode | null;
  operationCode?: string;
  bsdaAnnexed?: boolean;
  transporters?: Transporter[];
}
