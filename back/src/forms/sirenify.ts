import buildSirenify from "../companies/sirenify";
import {
  CompanyInput,
  CreateFormInput,
  NextSegmentInfoInput,
  ResealedFormInput,
  TransporterInput,
  UpdateFormInput
} from "../generated/graphql/types";

type FormInput = CreateFormInput | UpdateFormInput;

const formInputAccessors = (input: FormInput) => [
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
          ...input.temporaryStorageDetail?.destination,
          company: companyInput
        }
      }
    })
  },
  ...(input.intermediaries ?? []).map((_, idx) => ({
    getter: () => input.intermediaries![idx],
    setter: (input: FormInput, companyInput: CompanyInput) => ({
      ...input,
      intermediaries: input.intermediaries!.map((current, i) =>
        i === idx ? companyInput : current
      )
    })
  }))
];

export const sirenifyFormInput = buildSirenify(formInputAccessors);

const resealedFormInputAccessors = (input: ResealedFormInput) => [
  {
    getter: () => input?.transporter?.company,
    setter: (input: ResealedFormInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.destination?.company,
    setter: (input: ResealedFormInput, companyInput: CompanyInput) => ({
      ...input,
      destination: { ...input.destination, company: companyInput }
    })
  }
];

export const sirenifyResealedFormInput = buildSirenify(
  resealedFormInputAccessors
);

const transportSegmentInputAccessors = (input: NextSegmentInfoInput) => [
  {
    getter: () => input?.transporter?.company,
    setter: (input: NextSegmentInfoInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  }
];

export const sirenifyTransportSegmentInput = buildSirenify(
  transportSegmentInputAccessors
);

const bsddTransporterInputAccessors = (input: TransporterInput) => [
  {
    getter: () => input?.company,
    setter: (input: TransporterInput, companyInput: CompanyInput) => ({
      ...input,
      company: companyInput
    })
  }
];

export const sirenifyTransporterInput = buildSirenify(
  bsddTransporterInputAccessors
);
