import buildSirenify from "../companies/sirenify";
import { BsvhuInput, CompanyInput } from "../generated/graphql/types";

const accessors = (input: BsvhuInput) => [
  {
    getter: () => input?.emitter?.company,
    setter: (input: BsvhuInput, companyInput: CompanyInput) => ({
      ...input,
      emitter: { ...input.emitter, company: companyInput }
    })
  },
  {
    getter: () => input?.transporter?.company,
    setter: (input: BsvhuInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.destination?.company,
    setter: (input: BsvhuInput, companyInput: CompanyInput) => ({
      ...input,
      destination: { ...input.destination, company: companyInput }
    })
  }
];

export const sirenify = buildSirenify(accessors);
