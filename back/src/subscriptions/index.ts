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
      const asyncIterator = await sub.iterable.catch(err =>
        console.error("Cannot get subscription iterator", err)
      );

      try {
        for await (let payload of asyncIterator) {
          sub.callback(payload);
        }
      } catch (err) {
        console.error("Error while iterating on subscription", err);
      }
    });
}
