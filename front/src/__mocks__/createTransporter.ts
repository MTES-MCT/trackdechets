import { Transporter } from "../generated/graphql/types";

export function createTransporter(props: Partial<Transporter>): Transporter {
  return {
    __typename: "Transporter",
    company: null,
    isExemptedOfReceipt: null,
    receipt: null,
    department: null,
    validityLimit: null,
    numberPlate: null,
    customInfo: null,
    ...props,
  };
}
