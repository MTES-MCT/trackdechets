import { BsdCurrentTab } from "Apps/common/types/commonTypes";
import {
  BsdEdge,
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge,
} from "generated/graphql/types";
import { Maybe } from "graphql/jsutils/Maybe";

export interface BsdCardListProps {
  bsds: BsdEdge[] | BsdaRevisionRequestEdge[] | FormRevisionRequestEdge[];
  siret: string;
  bsdCurrentTab: BsdCurrentTab;
  siretsWithAutomaticSignature?: (Maybe<string> | undefined)[];
}
