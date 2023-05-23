import { WorkflowDisplayType } from "Apps/Common/types/bsdTypes";
import { BsdType } from "../../../../generated/graphql/types";

export interface WasteDetailsProps {
  wasteType?: BsdType;
  code?: string;
  name?: string;
  workflowType?: WorkflowDisplayType;
}
