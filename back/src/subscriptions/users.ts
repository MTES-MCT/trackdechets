import { UserSubscriptionPayload } from "../generated/prisma-client";
import { addContact } from "../common/mails.helper";

export async function usersSubscriptionCallback(
  payload: UserSubscriptionPayload
) {
  addNewUserAsContact(payload).catch(err =>
    console.error("Error on addNewUserAsContact subscription", err)
  );
}

function addNewUserAsContact(payload: UserSubscriptionPayload) {
  if (payload.mutation !== "CREATED") {
    return;
  }

  return addContact({ email: payload.node.email, name: payload.node.name });
}
