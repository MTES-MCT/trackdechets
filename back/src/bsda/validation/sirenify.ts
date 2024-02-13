import { nextBuildSirenify } from "../../companies/sirenify";
import { CompanyInput } from "../../generated/graphql/types";
import { ZodBsda } from "./schema";

type SiretInfos = {
  name: string | null | undefined;
  address: string | null | undefined;
};

const accessors = (
  input: ZodBsda,
  sealedFields: string[] // Tranformations should not be run on sealed fields
) => [
  {
    siret: input?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input, companyInput: SiretInfos) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.workerCompanySiret,
    skip: sealedFields.includes("workerCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.workerCompanyName = companyInput.name;
      input.workerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.brokerCompanyName = companyInput.name;
      input.brokerCompanyAddress = companyInput.address;
    }
  },
  ...(input.intermediaries ?? []).map((_, idx) => ({
    siret: input.intermediaries![idx].siret,
    skip: sealedFields.includes("intermediaries"),
    setter: (input, companyInput: CompanyInput) => {
      const intermediary = input.intermediaries[idx];

      intermediary.name = companyInput.name;
      intermediary.address = companyInput.address;
    }
  }))
];

export const sirenify = nextBuildSirenify(accessors);
