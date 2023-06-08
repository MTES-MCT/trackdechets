import { nextBuildSirenify } from "../../companies/sirenify";
import { CompanyInput } from "../../generated/graphql/types";
import { flattenBsdaInput } from "../converter";

type SiretInfos = {
  name: string | null | undefined;
  address: string | null | undefined;
};

const accessors = (input: ReturnType<typeof flattenBsdaInput>) => [
  {
    siret: input?.emitterCompanySiret,
    setter: (input, companyInput: SiretInfos) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.transporterCompanySiret,
    setter: (input, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.destinationCompanySiret,
    setter: (input, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: input?.workerCompanySiret,
    setter: (input, companyInput: CompanyInput) => {
      input.workerCompanyName = companyInput.name;
      input.workerCompanyAddress = companyInput.address;
    }
  },
  ...(input.intermediaries ?? []).map((_, idx) => ({
    siret: input.intermediaries![idx].siret,
    setter: (input, companyInput: CompanyInput) => {
      const intermediary = input.intermediaries[idx];

      intermediary.workerCompanyName = companyInput.name;
      intermediary.workerCompanyAddress = companyInput.address;
    }
  }))
];

export const sirenify = nextBuildSirenify(accessors);
