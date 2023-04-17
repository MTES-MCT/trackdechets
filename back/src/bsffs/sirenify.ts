import buildSirenify from "../companies/sirenify";
import {
  BsffFicheInterventionInput,
  BsffInput,
  CompanyInput,
  UpdateBsffPackagingInput
} from "../generated/graphql/types";

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
