import { Recipient } from "../generated/graphql/types";

export function createRecipient(props: Partial<Recipient>): Recipient {
  return {
    __typename: "Recipient",
    cap: null,
    processingOperation: null,
    company: null,
    isTempStorage: null,
    ...props
  };
}
