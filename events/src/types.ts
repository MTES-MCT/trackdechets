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
  _id: string; // This is the streamId
  latestEvent: Date;
  events: TDEvent[];
};
