import { prisma } from "../generated/prisma-client";
import { usersSubscriptionCallback } from "./users";
import { formsSubscriptionCallback } from "./forms";

const subscriptions = {
  form: {
    iterable: prisma.$subscribe.form(),
    callback: formsSubscriptionCallback
  },
  user: {
    iterable: prisma.$subscribe.user(),
    callback: usersSubscriptionCallback
  }
};

export function initSubsriptions() {
  Object.keys(subscriptions)
    .map(key => subscriptions[key])
    .forEach(async sub => {
      const asyncIterator = await sub.iterable;

      for await (let payload of asyncIterator) {
        sub.callback(payload);
      }

      // while (true) {
      //   const payload = await asyncIterator.next();
      // }
    });
}
