import { ActivityEvent } from "./types";

export function aggregateStream<Aggregate, StreamEvents extends ActivityEvent>(
  events: StreamEvents[],
  reducer: (
    currentState: Partial<Aggregate>,
    event: StreamEvents
  ) => Partial<Aggregate>,
  check?: (state: Partial<Aggregate>) => state is Aggregate
): Aggregate {
  const state = events.reduce<Partial<Aggregate>>(reducer, {});

  if (!check) {
    return state as Aggregate;
  }

  if (!check(state)) {
    throw new Error("Aggregate state is not valid");
  }

  return state;
}
