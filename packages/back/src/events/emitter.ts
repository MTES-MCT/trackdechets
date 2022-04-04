import { EventEmitter } from "events";

export enum TDEvent {
  TransitionForm = "transitionForm",
  CreateForm = "createForm",
  CreateCompany = "createCompany"
}

export interface TDEventPayload<T> {
  previousNode: T;
  node: T;
  updatedFields: Record<string, any>;
  mutation: "CREATED" | "UPDATED" | "DELETED";
}

class TDEventEmitter extends EventEmitter {
  constructor() {
    super();
  }

  emit<T>(event: TDEvent, payload: TDEventPayload<T>) {
    return super.emit(event, payload);
  }

  onAny<T>(events: TDEvent[], callback: (payload: TDEventPayload<T>) => void) {
    for (const event of events) {
      this.on(event, callback);
    }
  }
}

export const eventEmitter = new TDEventEmitter();
