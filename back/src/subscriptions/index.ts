import { prisma } from "../generated/prisma-client";
import { companiesSubscriptionCallback } from "./companies";
import { formsSubscriptionCallback } from "./forms";

type Subscription = {
  iterable: () => Promise<AsyncIterator<any>>;
  callback: (payload: { value: any } & any) => Promise<void>;
};

const subscriptions: Subscription[] = [
  {
    iterable: () => prisma.$subscribe.form(),
    callback: formsSubscriptionCallback
  },
  {
    iterable: () => prisma.$subscribe.company(),
    callback: companiesSubscriptionCallback
  }
];

export function initSubsriptions() {
  subscriptions.map(async sub => {
    try {
      const asyncIterator = await sub.iterable();

      while (true) {
        const payload = await asyncIterator.next();
        sub.callback(payload.value);
      }
    } catch (err) {
      console.error("Error while setting up or triggering subscription", err);
    }
  });
}
