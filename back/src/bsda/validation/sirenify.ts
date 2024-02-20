import { ParsedZodBsda } from "./schema";
import { CompanyInput } from "../../generated/graphql/types";
import { nextBuildSirenify } from "../../companies/sirenify";
import { getSealedFields } from "./rules";
import { BsdaValidationContext, ZodBsdaTransformer } from "./types";

type SiretInfos = {
  name: string | null | undefined;
  address: string | null | undefined;
};

const sirenifyAccessors = (
  bsda: ParsedZodBsda,
  sealedFields: string[] // Tranformations should not be run on sealed fields
) => [
  {
    siret: bsda?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input, companyInput: SiretInfos) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.workerCompanySiret,
    skip: sealedFields.includes("workerCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.workerCompanyName = companyInput.name;
      input.workerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.brokerCompanyName = companyInput.name;
      input.brokerCompanyAddress = companyInput.address;
    }
  },
  ...(bsda.intermediaries ?? []).map((_, idx) => ({
    siret: bsda.intermediaries![idx].siret,
    skip: sealedFields.includes("intermediaries"),
    setter: (input, companyInput: CompanyInput) => {
      const intermediary = input.intermediaries[idx];
      intermediary.name = companyInput.name;
      intermediary.address = companyInput.address;
    }
  }))
];

export const sirenify: (
  context: BsdaValidationContext
) => ZodBsdaTransformer = context => {
  return async bsda => {
    const sealedFields = await getSealedFields(bsda, context);
    return nextBuildSirenify<ParsedZodBsda>(sirenifyAccessors)(
      bsda,
      sealedFields
    );
  };
};
