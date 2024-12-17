import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../companies/sirenify";
import type { CompanyInput } from "@td/codegen-back";

import { ZodFullBspaoh } from "./schema";
type SiretInfos = {
  name: string | null | undefined;
  address: string | null | undefined;
};

const accessors = (
  input: ZodFullBspaoh,
  sealedFields: string[] // Transformations should not be run on sealed fields
): NextCompanyInputAccessor<ZodFullBspaoh>[] => {
  return [
    {
      siret: input?.emitterCompanySiret,
      skip: sealedFields.includes("emitterCompanySiret"),
      setter: (input, companyInput: SiretInfos) => {
        input.emitterCompanyName = companyInput.name;
        input.emitterCompanyAddress = companyInput.address;
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
      siret: input?.transporterCompanySiret,
      skip: sealedFields.includes("transporterCompanySiret"),
      setter: (input, companyInput: CompanyInput) => {
        input.transporterCompanyName = companyInput.name;
        input.transporterCompanyAddress = companyInput.address;
      }
    }
  ];
};

export const sirenify = nextBuildSirenify(accessors);
