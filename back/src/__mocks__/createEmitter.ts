import { Emitter } from "../generated/graphql/types";

export function createEmitter(props: Partial<Emitter>): Emitter {
  return {
    __typename: "Emitter",
    type: null,
    workSite: null,
    pickupSite: null,
    company: null,
    ...props
  };
}
