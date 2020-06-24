import { Destination } from "../generated/graphql/types";

export function createDestination(props: Partial<Destination>): Destination {
  return {
    __typename: "Destination",
    cap: null,
    processingOperation: null,
    company: null,
    isFilledByEmitter: null,
    ...props
  };
}
