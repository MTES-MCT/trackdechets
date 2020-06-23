import { FormCompany } from "../generated/graphql/types";

export function createCompany(props: Partial<FormCompany>): FormCompany {
  return {
    __typename: "FormCompany",
    name: null,
    siret: null,
    address: null,
    contact: null,
    phone: null,
    mail: null,
    ...props,
  };
}
