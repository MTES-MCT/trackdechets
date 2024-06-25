import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export type CorrelationId = string;
const correlationIdStorage = new AsyncLocalStorage<CorrelationId>();

export function runWithCorrelationId<R>(callback: () => R): R {
  return correlationIdStorage.run(randomUUID(), callback);
}

export function getCorrelationId(): CorrelationId | undefined {
  return correlationIdStorage.getStore();
}
