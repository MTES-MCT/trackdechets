import { eventEmitter, TDEvent } from "./emitter";
import { formsEventCallback } from "./forms";

export function initSubscriptions() {
  eventEmitter.onAny(
    [TDEvent.TransitionForm, TDEvent.CreateForm],
    formsEventCallback
  );
}
