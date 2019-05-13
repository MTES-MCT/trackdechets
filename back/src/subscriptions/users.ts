import { UserSubscriptionPayload } from "../generated/prisma-client";
import { addContact } from "../common/mails.helper";

export async function usersSubscriptionCallback(
  payload: UserSubscriptionPayload
) {
  // As soon as you send an email though mailjet, he is added to the contacts
  // As we send welcome emails, no need to add him ourself
  // addNewUserAsContact(payload).catch(err =>
  //   console.error("Error on addNewUserAsContact subscription", err)
  // );
}

function addNewUserAsContact(payload: UserSubscriptionPayload) {
  if (payload.mutation !== "CREATED") {
    return;
  }

  return addContact({ email: payload.node.email, name: payload.node.name });
}
