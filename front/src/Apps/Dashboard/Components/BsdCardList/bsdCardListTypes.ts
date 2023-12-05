import { BsdCurrentTab } from "../../../common/types/commonTypes";
import {
  BsdEdge,
  BsdaRevisionRequestEdge,
  FormRevisionRequestEdge
} from "codegen-ui";
import { Maybe } from "graphql/jsutils/Maybe";

export interface BsdCardListProps {
  bsds: BsdEdge[] | BsdaRevisionRequestEdge[] | FormRevisionRequestEdge[];
  siret: string;
  bsdCurrentTab: BsdCurrentTab;
  siretsWithAutomaticSignature?: (Maybe<string> | undefined)[];
}
