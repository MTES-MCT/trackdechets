import { TBsdStatusCode } from "../../../common/types/bsdTypes";
import { BsdCurrentTab } from "../../../common/types/commonTypes";
import {
  Bsd,
  BsdaRevisionRequestApproval,
  FormCompany,
  FormRevisionRequestApproval
} from "@td/codegen-ui";

export interface BsdCardProps {
  bsd:
    | Bsd
    | (Bsd & {
        review: {
          approvals: FormRevisionRequestApproval[] &
            BsdaRevisionRequestApproval[];
          authoringCompany: FormCompany;
          status: TBsdStatusCode;
          id: string;
        };
      });
  posInSet?: number;
  setSize?: number;
  bsdCurrentTab?: BsdCurrentTab;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
  secondaryActions: {
    onUpdate?: Function;
    onOverview: Function;
    onRevision?: Function;
    onBsdSuite?: Function;
    onAppendix1?: Function;
    onConsultReview?: Function;
    onEmitterDasriSign?: Function;
    onEmitterBsddSign?: Function;
  };
  hasAutomaticSignature?: boolean;
}
