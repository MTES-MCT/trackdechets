import { UserSubscriptionPayload } from "../generated/prisma-client";

export async function usersSubscriptionCallback(
  payload: UserSubscriptionPayload
) {
  console.log(payload);
}
