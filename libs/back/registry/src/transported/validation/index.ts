import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineEmitter,
  refineDestination,
  refineGistridNumber,
  refineWasteCode,
  refinePlates
} from "./refinement";
import { transportedSchema } from "./schema";
import {
  transformAndRefineReason,
  transformReportForRecepisseNumber
} from "./transform";

export function safeParseAsyncTransported(line: unknown) {
  return transportedSchema
    .superRefine(refineDates)
    .superRefine(refineEmitter)
    .superRefine(refineDestination)
    .superRefine(refineWasteCode)
    .superRefine(refineGistridNumber)
    .superRefine(refinePlates)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .transform(transformReportForRecepisseNumber)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
