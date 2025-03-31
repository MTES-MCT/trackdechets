import {
  parcelRefinement,
  refineEcoOrgBrokerAndTrader,
  refineFollowingTraceabilityInfos,
  refineIsDangerous,
  refineMunicipalities,
  refineGistridNumber,
  refineOperationCodeWhenUpcycled,
  refineRequiredOperationMode,
  refineOperationModeConsistency,
  refineTransportersConsistency,
  requiredParcelsRefinement
} from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  initialEmitterRefinement,
  emitterRefinement,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement,
  refineReportForProfile
} from "./refinement";
import { incomingTexsSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncIncomingTexs(line: unknown) {
  return incomingTexsSchema
    .superRefine(refineReportForProfile)
    .superRefine(refineIsDangerous)
    .superRefine(refineMunicipalities)
    .superRefine(refineGistridNumber)
    .superRefine(initialEmitterRefinement)
    .superRefine(emitterRefinement)
    .superRefine(parcelRefinement)
    .superRefine(requiredParcelsRefinement)
    .superRefine(refineOperationCodeWhenUpcycled)
    .superRefine(refineRequiredOperationMode)
    .superRefine(refineOperationModeConsistency)
    .superRefine(refineFollowingTraceabilityInfos)
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
