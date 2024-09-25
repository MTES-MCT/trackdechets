import { Prisma } from "@prisma/client";
import buildSirenify, {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../companies/sirenify";
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

const bsdasriCreateInputAccessors = (
  input: Prisma.BsdasriCreateInput,
  sealedFields: string[] = [] // Tranformations should not be run on sealed fields
): NextCompanyInputAccessor<Prisma.BsdasriCreateInput>[] => [
  {
    siret: input?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input, companyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.ecoOrganismeSiret,
    skip: sealedFields.includes("ecoOrganismeSiret"),
    setter: (input, companyInput) => {
      input.ecoOrganismeName = companyInput.name;
    }
  }
];

export const sirenifyBsdasriCreateInput = nextBuildSirenify(
  bsdasriCreateInputAccessors
);
