import { BsdCurrentTab } from "Apps/Common/types/commonTypes";
import { Bsd } from "generated/graphql/types";

export interface BsdCardProps {
  bsd: Bsd;
  bsdCurrentTab?: BsdCurrentTab;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
  onOverview?: Function;
  onPdf?: Function;
  onDuplicate?: Function;
  onUpdate?: Function;
  onDelete?: Function;
  onRevision?: Function;
}
