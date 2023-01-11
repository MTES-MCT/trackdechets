import { BsdDisplay } from "common/types/bsdTypes";

export interface BsdAdditionalActionsButtonProps {
  bsd: BsdDisplay;
  currentSiret: string;
  onOverview: Function;
  onPdf: Function;
  onDuplicate: Function;
  onUpdate: Function;
  onDelete: Function;
  onRevision: Function;
  children?: React.ReactNode;
}
