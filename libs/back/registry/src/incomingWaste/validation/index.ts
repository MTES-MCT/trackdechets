import {
    refineFollowingTraceabilityInfos,
  refineIsDangerous,
  refineMunicipalities,
  refineNotificationNumber,
  refineOperationMode,
  refineWeightAndVolume
} from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  initialEmitterRefinement,
  refineWeighingHour,
  emitterRefinement,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement,
  refineReportForProfile
} from "./refinement";
import { incomingWasteSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncIncomingWaste(line: unknown) {
  return incomingWasteSchema
    .superRefine(refineReportForProfile)
    .superRefine(refineIsDangerous)
    .superRefine(refineWeighingHour)
    .superRefine(refineWeightAndVolume)
    .superRefine(refineMunicipalities)
    .superRefine(refineNotificationNumber)
    .superRefine(initialEmitterRefinement)
    .superRefine(emitterRefinement)
    .superRefine(refineOperationMode)
    .superRefine(refineFollowingTraceabilityInfos)
    .superRefine(transporter1Refinement)
    .superRefine(transporter2Refinement)
    .superRefine(transporter3Refinement)
    .superRefine(transporter4Refinement)
    .superRefine(transporter5Refinement)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
