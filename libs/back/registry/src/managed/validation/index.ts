import { refineTransportersConsistency } from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineEmitter,
  refineDestination,
  refineInitialEmitter,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement,
  refineNotificationNumber
} from "./refinement";
import { managedSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncManaged(line: unknown) {
  return managedSchema
    .superRefine(refineDates)
    .superRefine(refineInitialEmitter)
    .superRefine(refineEmitter)
    .superRefine(refineDestination)
    .superRefine(refineNotificationNumber)
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
