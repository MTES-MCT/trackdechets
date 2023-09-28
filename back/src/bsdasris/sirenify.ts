import buildSirenify from "../companies/sirenify";
import { BsdasriInput, CompanyInput } from "../generated/graphql/types";

const accessors = (input: BsdasriInput) => [
  {
    getter: () => input?.emitter?.company,
    setter: (input: BsdasriInput, companyInput: CompanyInput) => ({
      ...input,
      emitter: { ...input.emitter, company: companyInput }
    })
  },
  {
    getter: () => input?.transporter?.company,
    setter: (input: BsdasriInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.destination?.company,
    setter: (input: BsdasriInput, companyInput: CompanyInput) => ({
      ...input,
      destination: { ...input.destination, company: companyInput }
    })
  }
];

export const sirenify = buildSirenify(accessors);
