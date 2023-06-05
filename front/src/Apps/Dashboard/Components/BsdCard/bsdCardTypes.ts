import { BsdCurrentTab } from "Apps/common/types/commonTypes";
import { Bsd } from "generated/graphql/types";

export interface BsdCardProps {
  bsd: Bsd;
  bsdCurrentTab?: BsdCurrentTab;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
  onOverview?: Function;
  onUpdate?: Function;
  onRevision?: Function;
  onBsdSuite?: Function;
  onAppendix1?: Function;
}
