import { Bsd } from "generated/graphql/types";

export interface BsdCardProps {
  bsd: Bsd;
  onValidate: (bsd: Bsd) => void;
}
