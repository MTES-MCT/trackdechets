import { BsdDisplay } from "Apps/common/types/bsdTypes";
import { UserPermission } from "generated/graphql/types";

export interface BsdAdditionalActionsButtonProps {
  bsd: BsdDisplay;
  permissions: UserPermission[];
  currentSiret: string;
  actionList: {
    onAppendix1?: Function;
    onBsdSuite?: Function;
    onDeleteReview?: Function;
    onEmitterDasriSign?: Function;
    onEmitterBsddSign?: Function;
  };
  hideReviewCta?: boolean;
  isToCollectTab?: boolean;
  hasAutomaticSignature?: boolean;
}
