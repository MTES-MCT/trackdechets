import buildSirenify from "../companies/sirenify";
import { BsdaInput, CompanyInput } from "../generated/graphql/types";

const accessors = (input: BsdaInput) => [
  {
    getter: () => input?.emitter?.company,
    setter: (input: BsdaInput, companyInput: CompanyInput) => ({
      ...input,
      emitter: { ...input.emitter, company: companyInput }
    })
  },
  {
    getter: () => input?.transporter?.company,
    setter: (input: BsdaInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.destination?.company,
    setter: (input: BsdaInput, companyInput: CompanyInput) => ({
      ...input,
      destination: { ...input.destination, company: companyInput }
    })
  },
  {
    getter: () => input?.worker?.company,
    setter: (input: BsdaInput, companyInput: CompanyInput) => ({
      ...input,
      worker: { ...input.worker, company: companyInput }
    })
  },
  ...(input.intermediaries ?? []).map((_, idx) => ({
    getter: () => input.intermediaries![idx],
    setter: (input: BsdaInput, companyInput: CompanyInput) => ({
      ...input,
      intermediaries: input.intermediaries!.map((current, i) =>
        i === idx ? companyInput : current
      )
    })
  }))
];

const sirenify = buildSirenify(accessors);

export default sirenify;
