import { Bsda } from "@prisma/client";
import { aggregateStream } from "../aggregator";
import { getStream } from "../data";
import { bsdaReducer } from "./reducer";
import { BsdaEvent } from "./types";

export * from "./types";
export * from "./reducer";

export async function getBsdaFromActivityEvents(bsddId: string, at?: Date) {
  const events = await getStream(bsddId, at ? { until: at } : undefined);

  return aggregateStream<Bsda, BsdaEvent>(events as BsdaEvent[], bsdaReducer);
}
