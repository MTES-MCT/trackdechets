import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineDestinationOrgId,
  refineSecondaryWasteCodes
} from "./refinement";
import { ssdSchema } from "./schema";
import { transformAndRefineReason } from "./transform";

export function safeParseAsyncSsd(line: unknown) {
  return ssdSchema
    .superRefine(refineDates)
    .superRefine(refineDestinationOrgId)
    .superRefine(refineSecondaryWasteCodes)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
