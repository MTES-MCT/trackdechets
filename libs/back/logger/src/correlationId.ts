import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";

export type CorrelationId = string;
const correlationIdStorage = new AsyncLocalStorage<CorrelationId>();

export function runWithCorrelationId<R>(callback: () => R): R {
  const uuid = randomBytes(16).toString("hex");
  return correlationIdStorage.run(uuid, callback);
}

export function getCorrelationId(): CorrelationId | undefined {
  return correlationIdStorage.getStore();
}
