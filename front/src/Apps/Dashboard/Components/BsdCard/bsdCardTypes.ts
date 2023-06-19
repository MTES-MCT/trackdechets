import { TBsdStatusCode } from "Apps/common/types/bsdTypes";
import { BsdCurrentTab } from "Apps/common/types/commonTypes";
import {
  Bsd,
  BsdaRevisionRequestApproval,
  FormCompany,
  FormRevisionRequestApproval,
} from "generated/graphql/types";

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
  bsdCurrentTab?: BsdCurrentTab;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
  secondaryActions: {
    onUpdate?: Function;
    onOverview: Function;
    onRevision?: Function;
    onBsdSuite?: Function;
    onAppendix1?: Function;
    onDeleteReview?: Function;
  };
}
