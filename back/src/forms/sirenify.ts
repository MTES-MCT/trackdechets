import buildSirenify from "../companies/sirenify";
import {
  CompanyInput,
  CreateFormInput,
  UpdateFormInput
} from "../generated/graphql/types";

type FormInput = CreateFormInput | UpdateFormInput;

const accessors = (input: FormInput) => [
  {
    getter: () => input?.emitter?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      emitter: { ...input.emitter, company: companyInput }
    })
  },
  {
    getter: () => input?.transporter?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.recipient?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      recipient: { ...input.recipient, company: companyInput }
    })
  },
  {
    getter: () => input?.trader?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      trader: { ...input.trader, company: companyInput }
    })
  },
  {
    getter: () => input?.broker?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      broker: { ...input.broker, company: companyInput }
    })
  },
  {
    getter: () => input?.temporaryStorageDetail?.destination?.company,
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      temporaryStorageDetail: {
        ...input.temporaryStorageDetail,
        destination: {
          ...input.temporaryStorageDetail.destination,
          company: companyInput
        }
      }
    })
  },
  ...(input.intermediaries ?? []).map((_, idx) => ({
    getter: () => input.intermediaries[idx],
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      intermediaries: input.intermediaries.map((current, i) =>
        i === idx ? companyInput : current
      )
    })
  }))
];

const sirenify = buildSirenify(accessors);

export default sirenify;
