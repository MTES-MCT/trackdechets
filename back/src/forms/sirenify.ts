import { Prisma } from "@prisma/client";
import buildSirenify, {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../companies/sirenify";
import type {
  CompanyInput,
  CreateFormInput,
  NextSegmentInfoInput,
  ResealedFormInput,
  TransporterInput,
  UpdateFormInput
} from "@td/codegen-back";

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

// Careful! This takes a Prisma.FormCreateInput as input,
// and not all possible use-cases are covered yet (ie, transporters.createMany, intermediaries.create etc.)
const formCreateInputAccessors = (
  formCreateInput: Prisma.FormCreateInput,
  sealedFields: string[] = [] // Tranformations should not be run on sealed fields
): NextCompanyInputAccessor<Prisma.FormCreateInput>[] => [
  {
    siret: formCreateInput?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      formCreateInput.emitterCompanyName = companyInput.name;
      formCreateInput.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: formCreateInput?.traderCompanySiret,
    skip: sealedFields.includes("traderCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      formCreateInput.traderCompanyName = companyInput.name;
      formCreateInput.traderCompanyAddress = companyInput.address;
    }
  },
  {
    siret: formCreateInput?.recipientCompanySiret,
    skip: sealedFields.includes("recipientCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      formCreateInput.recipientCompanyName = companyInput.name;
      formCreateInput.recipientCompanyAddress = companyInput.address;
    }
  },
  {
    siret: formCreateInput?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      formCreateInput.brokerCompanyName = companyInput.name;
      formCreateInput.brokerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: formCreateInput?.ecoOrganismeSiret,
    skip: sealedFields.includes("ecoOrganismeSiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      if (companyInput.name) {
        formCreateInput.ecoOrganismeName = companyInput.name;
      }
    }
  },
  ...(
    (formCreateInput?.intermediaries?.createMany
      ?.data as Prisma.IntermediaryFormAssociationCreateManyFormInput[]) ?? []
  ).map((_, idx) => ({
    siret: formCreateInput?.intermediaries?.createMany?.data![idx].siret,
    skip: sealedFields.includes("intermediaryCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      const intermediary =
        formCreateInput?.intermediaries?.createMany?.data![idx];

      intermediary.name = companyInput.name;
      intermediary.address = companyInput.address;
    }
  })),
  {
    siret: (
      formCreateInput?.transporters
        ?.create as Prisma.BsddTransporterCreateWithoutFormInput
    )?.transporterCompanySiret,
    skip:
      !formCreateInput?.transporters?.create ||
      !(
        formCreateInput?.transporters
          ?.create as Prisma.BsddTransporterCreateWithoutFormInput
      )?.transporterCompanySiret ||
      sealedFields.includes("transporterCompanySiret"),
    setter: (formCreateInput, companyInput: CompanyInput) => {
      (
        formCreateInput.transporters
          ?.create as Prisma.BsddTransporterCreateWithoutFormInput
      ).transporterCompanyName = companyInput.name;
      (
        formCreateInput.transporters
          ?.create as Prisma.BsddTransporterCreateWithoutFormInput
      ).transporterCompanyAddress = companyInput.address;
    }
  }
];

export const sirenifyFormCreateInput = nextBuildSirenify(
  formCreateInputAccessors
);
