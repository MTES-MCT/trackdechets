import { BsdDisplay } from "Apps/common/types/bsdTypes";

export interface BsdAdditionalActionsButtonProps {
  bsd: BsdDisplay;
  currentSiret: string;
  actionList: {
    onOverview: Function;
    onPdf?: Function;
    onDuplicate: Function;
    onUpdate?: Function;
    onDelete?: Function;
    onRevision?: Function;
    onAppendix1?: Function;
    onBsdSuite?: Function;
    onDeleteReview?: Function;
  };
  hideReviewCta?: boolean;
}
