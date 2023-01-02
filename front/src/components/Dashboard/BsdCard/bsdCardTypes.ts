import { Bsd } from "generated/graphql/types";

export interface BsdCardProps {
  bsd: Bsd;
  currentSiret: string;
  onValidate: (bsd: Bsd) => void;
}
