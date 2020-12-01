import { companiesSubscriptionCallback } from "./companies";
import { eventEmitter, TDEvent } from "./emitter";
import { formsEventCallback } from "./forms";

export function initSubscriptions() {
  eventEmitter.onAny(
    [TDEvent.TransitionForm, TDEvent.CreateForm],
    formsEventCallback
  );

  eventEmitter.onAny([TDEvent.CreateCompany], companiesSubscriptionCallback);
}
