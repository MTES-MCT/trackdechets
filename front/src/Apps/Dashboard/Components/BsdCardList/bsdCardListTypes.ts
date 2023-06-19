import { BsdCurrentTab } from "Apps/common/types/commonTypes";
import {
  BsdEdge,
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge,
} from "generated/graphql/types";

export interface BsdCardListProps {
  bsds: BsdEdge[] | BsdaRevisionRequestEdge[] | FormRevisionRequestEdge[];
  siret: string;
  bsdCurrentTab: BsdCurrentTab;
}
