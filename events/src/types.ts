export type TDEvent = {
  id: string;
  createdAt: Date;

  streamId: string;
  type: string;
  data: object;
  metadata?: object;

  actor: string;
};

export type EventCollection = {
  streamId: string;
  latestEvent: Date;
  events: TDEvent[];
};
