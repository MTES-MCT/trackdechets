import { Bsdasri } from "@td/prisma";
import { AppDataloaders } from "../../types";
import { aggregateStream } from "../aggregator";
import { getStream } from "../data";
import { bsdasriReducer } from "./reducer";
import { BsdasriEvent } from "./types";

export * from "./types";
export * from "./reducer";

type BsdasriEventsParams = { bsdasriId: string; at?: Date };

export async function getBsdasriFromActivityEvents(
  { bsdasriId, at }: BsdasriEventsParams,
  options?: { dataloader: AppDataloaders["events"] }
) {
  const events = await (options?.dataloader
    ? options.dataloader.load({ streamId: bsdasriId, lte: at })
    : getStream(bsdasriId, at ? { until: at } : undefined));

  return aggregateStream<Bsdasri, BsdasriEvent>(
    events as BsdasriEvent[],
    bsdasriReducer
  );
}
