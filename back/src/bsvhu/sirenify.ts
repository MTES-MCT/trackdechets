import { Prisma } from "@prisma/client";
import buildSirenify, { nextBuildSirenify } from "../companies/sirenify";
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

const bsvhuCreateInputAccessors = (
  input: Prisma.BsvhuCreateInput,
  sealedFields: string[] = [] // Tranformations should not be run on sealed fields
) => [
  {
    siret: input?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input: Prisma.BsdasriCreateInput, companyInput: CompanyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input: Prisma.BsdasriCreateInput, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input: Prisma.BsdasriCreateInput, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  }
];

export const sirenifyBsvhuCreateInput = nextBuildSirenify(
  bsvhuCreateInputAccessors
);
