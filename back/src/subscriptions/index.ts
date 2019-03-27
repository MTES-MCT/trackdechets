import { prisma } from "../generated/prisma-client";
import { usersSubscriptionCallback } from "./users";
import { formsSubscriptionCallback } from "./forms";

const subscriptions = [
  {
    iterable: () => prisma.$subscribe.form(),
    callback: formsSubscriptionCallback
  },
  {
    iterable: () => prisma.$subscribe.user(),
    callback: usersSubscriptionCallback
  }
];

export function initSubsriptions() {
  subscriptions.map(async sub => {
    try {
      const asyncIterator = await sub.iterable();

      while (true) {
        const payload = await asyncIterator.next();
        sub.callback(payload.value as any);
      }
    } catch (err) {
      console.error("Error while setting up or triggering subscription", err);
    }
  });
}
