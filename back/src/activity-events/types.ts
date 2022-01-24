export type ActivityEvent<
  EventType extends string = string,
  EventData extends Record<string, unknown> = Record<string, unknown>,
  EventMetadata extends Record<string, unknown> = Record<string, unknown>
> = Readonly<{
  type: Readonly<EventType>;
  actorId: Readonly<string>;
  streamId: Readonly<string>;
  data: Readonly<EventData>;
  metadata?: Readonly<EventMetadata>;
}>;
