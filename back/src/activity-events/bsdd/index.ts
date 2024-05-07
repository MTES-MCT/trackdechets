import { Form } from "@prisma/client";
import { aggregateStream, getStream } from "..";
import { AppDataloaders } from "../../types";
import { bsddReducer } from "./reducer";
import { BsddEvent } from "./types";

export * from "./types";
export * from "./reducer";

type BsddEventsParams = {
  bsddId: string;
  at?: Date;
};

export async function getBsddFromActivityEvents(
  { bsddId, at }: BsddEventsParams,
  options?: { dataloader: AppDataloaders["events"] }
) {
  const events = await (options?.dataloader
    ? options.dataloader.load({ streamId: bsddId, lte: at })
    : getStream(bsddId, at ? { until: at } : undefined));

  return aggregateStream<Form, BsddEvent>(events as BsddEvent[], bsddReducer);
}
