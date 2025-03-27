import {
  refineEcoOrgBrokerAndTrader,
  refineIsDangerous,
  refineMunicipalities,
  refineGistridNumber,
  refineTransportersConsistency,
  refineOperationModeConsistency
} from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  initialEmitterRefinement,
  destinationRefinement,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement
} from "./refinement";
import { outgoingWasteSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncOutgoingWaste(line: unknown) {
  return outgoingWasteSchema
    .superRefine(refineIsDangerous)
    .superRefine(refineMunicipalities)
    .superRefine(refineGistridNumber)
    .superRefine(initialEmitterRefinement)
    .superRefine(destinationRefinement)
    .superRefine(refineOperationModeConsistency)
    .superRefine(refineEcoOrgBrokerAndTrader)
    .superRefine(transporter1Refinement)
    .superRefine(transporter2Refinement)
    .superRefine(transporter3Refinement)
    .superRefine(transporter4Refinement)
    .superRefine(transporter5Refinement)
    .superRefine(refineTransportersConsistency)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
