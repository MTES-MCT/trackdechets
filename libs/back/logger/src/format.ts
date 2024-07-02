import { format } from "winston";
import { getCorrelationId } from "./correlationId";

export const addMetadata = format(info => {
  info.correlationId = getCorrelationId();
  info.loggedAt = Date.now();
  return info;
});
