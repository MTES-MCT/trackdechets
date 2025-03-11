import { transformReportForInfos } from "../../shared/transform";
import { registryErrorMap } from "../../zodErrors";
import {
  refineDates,
  refineEmitter,
  refineDestination,
  refineGistridNumber
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
    .superRefine(refineGistridNumber)
    .transform(transformAndRefineReason)
    .transform(transformReportForInfos)
    .transform(transformReportForRecepisseNumber)
    .safeParseAsync(line, { errorMap: registryErrorMap });
}
