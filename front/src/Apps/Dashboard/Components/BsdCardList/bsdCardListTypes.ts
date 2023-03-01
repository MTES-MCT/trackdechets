import { BsdCurrentTab } from "Apps/Common/types/commonTypes";
import { BsdEdge } from "generated/graphql/types";

export interface BsdCardListProps {
  bsds: BsdEdge[];
  siret: string;
  bsdCurrentTab: BsdCurrentTab;
}
