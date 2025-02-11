import {
  parcelRefinement,
  refineIsDangerous,
  refineMunicipalities,
  refineNotificationNumber,
  refineOperationCodeWhenUpcycled,
  refineOperationMode,
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
import { outgoingTexsSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncOutgoingTexs(line: unknown) {
  return outgoingTexsSchema
    .superRefine(refineIsDangerous)
    .superRefine(refineMunicipalities)
    .superRefine(refineNotificationNumber)
    .superRefine(initialEmitterRefinement)
    .superRefine(destinationRefinement)
    .superRefine(parcelRefinement)
    .superRefine(refineOperationMode)
    .superRefine(refineOperationCodeWhenUpcycled)
    .superRefine(transporter1Refinement)
    .superRefine(transporter2Refinement)
    .superRefine(transporter3Refinement)
    .superRefine(transporter4Refinement)
    .superRefine(transporter5Refinement)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
