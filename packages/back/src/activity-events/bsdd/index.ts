import { Form } from "@prisma/client";
import { aggregateStream, getStream, persistEvent } from "..";
import { bsddReducer } from "./reducer";
import { BsddEvent, BsddRevisionRequestEvent } from "./types";

export * from "./types";
export * from "./reducer";

export function persistBsddEvent(bsddEvent: BsddEvent) {
  return persistEvent(bsddEvent);
}

export function persistBsddRevisionRequestEvent(
  bsddRevisionRequestEvent: BsddRevisionRequestEvent
) {
  return persistEvent(bsddRevisionRequestEvent);
}

export async function getBsddFromActivityEvents(bsddId: string, at?: Date) {
  const events = await getStream(bsddId, at ? { until: at } : undefined);

  return aggregateStream<Form, BsddEvent>(events as BsddEvent[], bsddReducer);
}
