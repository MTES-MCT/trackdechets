import { Bsda } from "@prisma/client";
import { AppDataloaders } from "../../types";
import { aggregateStream } from "../aggregator";
import { getStream } from "../data";
import { bsdaReducer } from "./reducer";
import { BsdaEvent } from "./types";

export * from "./types";
export * from "./reducer";

type BsdaEventsParams = { bsdaId: string; at?: Date };

export async function getBsdaFromActivityEvents(
  { bsdaId, at }: BsdaEventsParams,
  options?: { dataloader: AppDataloaders["events"] }
) {
  const events = await (options?.dataloader
    ? options.dataloader.load({ streamId: bsdaId, lte: at })
    : getStream(bsdaId, at ? { until: at } : undefined));

  return aggregateStream<Bsda, BsdaEvent>(events as BsdaEvent[], bsdaReducer);
}
