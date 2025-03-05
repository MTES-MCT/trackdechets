import {
  parcelRefinement,
  refineEcoOrgBrokerAndTrader,
  refineIsDangerous,
  refineMunicipalities,
  refineNotificationNumber,
  refineOperationCodeWhenUpcycled,
  refineTransportersConsistency,
  requiredParcelsRefinement
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
    .superRefine(requiredParcelsRefinement)
    .superRefine(refineOperationCodeWhenUpcycled)
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
