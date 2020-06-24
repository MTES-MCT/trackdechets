import { WasteDetails } from "../generated/graphql/types";

export function createWasteDetails(props: Partial<WasteDetails>): WasteDetails {
  return {
    __typename: "WasteDetails",
    code: null,
    name: null,
    onuCode: null,
    packagings: [],
    otherPackaging: null,
    numberOfPackages: null,
    quantity: null,
    quantityType: null,
    consistence: null,
    ...props
  };
}
