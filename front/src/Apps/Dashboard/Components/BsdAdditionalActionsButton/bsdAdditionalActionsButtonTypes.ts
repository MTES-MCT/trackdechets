import { BsdDisplay } from "../../../common/types/bsdTypes";
import { UserPermission } from "@td/codegen-ui";

export interface BsdAdditionalActionsButtonProps {
  bsd: BsdDisplay;
  permissions: UserPermission[];
  currentSiret: string;
  actionList: {
    onOverview: Function;
    onPdf?: Function;
    onDuplicate: Function;
    onUpdate?: Function;
    onClone?: Function;
    onDelete?: Function;
    onRevision?: Function;
    onAppendix1?: Function;
    onBsdSuite?: Function;
    onConsultReview?: Function;
    onEmitterDasriSign?: Function;
    onEmitterBsddSign?: Function;
    onCorrection?: Function;
  };
  hideReviewCta?: boolean;
  isToCollectTab?: boolean;
  hasAutomaticSignature?: boolean;
  emitterIsExutoireOrTtr?: boolean;
}
