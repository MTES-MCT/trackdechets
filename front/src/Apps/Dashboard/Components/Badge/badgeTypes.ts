import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import {
  BsdType,
  BsdaTransporter,
  RevisionRequestStatus,
  Transporter
} from "@td/codegen-ui";

export interface BadgeProps {
  status?: TBsdStatusCode;
  isDraft?: boolean;
  bsdType?: BsdType;
  reviewStatus?: TBsdStatusCode | null | RevisionRequestStatus;
  operationCode?: string;
  bsdaAnnexed?: boolean;
  transporters?: Transporter[] | BsdaTransporter[];
}
