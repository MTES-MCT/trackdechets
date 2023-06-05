import { BsdDisplay } from "Apps/common/types/bsdTypes";

export interface BsdAdditionalActionsButtonProps {
  bsd: BsdDisplay;
  currentSiret: string;
  onOverview: Function;
  onPdf: Function;
  onDuplicate: Function;
  onUpdate: Function;
  onDelete: Function;
  onRevision: Function;
  onBsdSuite?: Function;
  onAppendix1?: Function;
}
