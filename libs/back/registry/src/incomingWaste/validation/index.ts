import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  producerRefinement,
  refineIsDangerous,
  refineMunicipalities,
  refineNotificationNumber,
  refineWeighingHour,
  refineWeightAndVolume,
  senderRefinement,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement
} from "./refinement";
import { incomingWasteSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncIncomingWaste(line: unknown) {
  return incomingWasteSchema
    .superRefine(refineIsDangerous)
    .superRefine(refineWeighingHour)
    .superRefine(refineWeightAndVolume)
    .superRefine(refineMunicipalities)
    .superRefine(refineNotificationNumber)
    .superRefine(producerRefinement)
    .superRefine(senderRefinement)
    .superRefine(transporter1Refinement)
    .superRefine(transporter2Refinement)
    .superRefine(transporter3Refinement)
    .superRefine(transporter4Refinement)
    .superRefine(transporter5Refinement)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
