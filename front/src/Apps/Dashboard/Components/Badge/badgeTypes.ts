import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import {
  BsdType,
  BsdaTransporter,
  BsffTransporter,
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
  transporters?: Transporter[] | BsdaTransporter[] | BsffTransporter[];
}
