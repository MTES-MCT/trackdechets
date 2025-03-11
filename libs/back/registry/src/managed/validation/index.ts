import {
  refineOperationCodeWhenUpcycled,
  refineTransportersConsistency
} from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineEmitter,
  refineDestination,
  refineInitialEmitter,
  refineTempStorer,
  transporter1Refinement,
  transporter2Refinement,
  transporter3Refinement,
  transporter4Refinement,
  transporter5Refinement,
  refineGistridNumber,
  refineManagedUpcycled
} from "./refinement";
import { managedSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncManaged(line: unknown) {
  return managedSchema
    .superRefine(refineDates)
    .superRefine(refineInitialEmitter)
    .superRefine(refineEmitter)
    .superRefine(refineDestination)
    .superRefine(refineTempStorer)
    .superRefine(refineGistridNumber)
    .superRefine(refineManagedUpcycled)
    .superRefine(refineOperationCodeWhenUpcycled)
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
