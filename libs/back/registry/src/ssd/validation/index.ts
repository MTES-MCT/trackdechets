import {
  refineOperationModeConsistency,
  refineRequiredOperationMode,
  refineDateLimits
} from "../../shared/refinement";
import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineDestination,
  refineReportForProfile,
  refineSecondaryWasteCodes
} from "./refinement";
import { ssdSchema } from "./schema";
import { transformAndRefineReason, transformDestination } from "./transform";

export function safeParseAsyncSsd(line: unknown) {
  return ssdSchema
    .superRefine(
      refineDateLimits([
        "useDate",
        "dispatchDate",
        "processingDate",
        "processingEndDate"
      ])
    )
    .superRefine(refineReportForProfile)
    .superRefine(refineDates)
    .superRefine(refineDestination)
    .superRefine(refineSecondaryWasteCodes)
    .superRefine(refineRequiredOperationMode)
    .superRefine(refineOperationModeConsistency)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .transform(transformDestination)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
