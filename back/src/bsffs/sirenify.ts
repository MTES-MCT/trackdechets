import { Prisma } from "@prisma/client";
import buildSirenify, { nextBuildSirenify } from "../companies/sirenify";
import type {
  BsffFicheInterventionInput,
  BsffInput,
  CompanyInput,
  UpdateBsffPackagingInput
} from "@td/codegen-back";

const bsffAccessors = (input: BsffInput) => [
  {
    getter: () => input?.emitter?.company,
    setter: (input: BsffInput, companyInput: CompanyInput) => ({
      ...input,
      emitter: { ...input.emitter, company: companyInput }
    })
  },
  {
    getter: () => input?.transporter?.company,
    setter: (input: BsffInput, companyInput: CompanyInput) => ({
      ...input,
      transporter: { ...input.transporter, company: companyInput }
    })
  },
  {
    getter: () => input?.destination?.company,
    setter: (input: BsffInput, companyInput: CompanyInput) => ({
      ...input,
      destination: { ...input.destination, company: companyInput }
    })
  }
];

export const sirenifyBsffInput = buildSirenify(bsffAccessors);

const bsffPackagingAccessors = (input: UpdateBsffPackagingInput) => [
  {
    getter: () => input?.operation?.nextDestination?.company,
    setter: (input: UpdateBsffPackagingInput, companyInput: CompanyInput) => ({
      ...input,
      ...(input.operation && {
        operation: {
          ...input.operation,
          nextDestination: {
            ...input.operation?.nextDestination,
            company: companyInput
          }
        }
      })
    })
  }
];

export const sirenifyBsffPackagingInput = buildSirenify(bsffPackagingAccessors);

const bsffFicheInterventionAccessors = (input: BsffFicheInterventionInput) => [
  {
    getter: () => input?.detenteur?.company,
    setter: (
      input: BsffFicheInterventionInput,
      companyInput: CompanyInput
    ) => ({
      ...input,
      detenteur: { ...input.detenteur, company: companyInput }
    })
  },
  {
    getter: () => input?.operateur?.company,
    setter: (
      input: BsffFicheInterventionInput,
      companyInput: CompanyInput
    ) => ({
      ...input,
      operateur: { ...input.operateur, company: companyInput }
    })
  }
];

export const sirenifyBsffFicheInterventionInput = buildSirenify(
  bsffFicheInterventionAccessors
);

const bsffCreateInputAccessors = (
  input: Prisma.BsffCreateInput,
  sealedFields: string[] = [] // Tranformations should not be run on sealed fields
) => [
  {
    siret: input?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input: Prisma.BsffCreateInput, companyInput: CompanyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input: Prisma.BsffCreateInput, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  }
];

export const sirenifyBsffCreateInput = nextBuildSirenify(
  bsffCreateInputAccessors
);

const bsffTransporterCreateInputAccessors = (
  input: Prisma.BsffTransporterCreateInput,
  sealedFields: string[] = []
) => [
  {
    siret: input?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (
      input: Prisma.BsffTransporterCreateInput,
      companyInput: CompanyInput
    ) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  }
];

export const sirenifyBsffTransporterCreateInput = nextBuildSirenify(
  bsffTransporterCreateInputAccessors
);
