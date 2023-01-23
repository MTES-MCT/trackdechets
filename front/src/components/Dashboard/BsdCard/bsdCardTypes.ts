import { Bsd } from "generated/graphql/types";

export interface BsdCardProps {
  bsd: Bsd;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
  onOverview?: Function;
  onPdf?: Function;
  onDuplicate?: Function;
  onUpdate?: Function;
  onDelete?: Function;
  onRevision?: Function;
}
