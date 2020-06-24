import { StateSummary } from "../generated/graphql/types";

export function createStateSummary(props: Partial<StateSummary>): StateSummary {
  return {
    __typename: "StateSummary",
    quantity: null,
    packagings: [],
    onuCode: null,
    transporter: null,
    transporterNumberPlate: null,
    transporterCustomInfo: null,
    recipient: null,
    emitter: null,
    lastActionOn: null,
    ...props
  };
}
