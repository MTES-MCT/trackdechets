import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../companies/sirenify";
import { ParsedZodBsdasri } from "./schema";

const sirenifyBsdasriAccessors = (
  bsdasri: ParsedZodBsdasri,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): NextCompanyInputAccessor<ParsedZodBsdasri>[] => [
  {
    siret: bsdasri?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret_"),
    setter: (input, companyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsdasri?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },

  {
    siret: bsdasri?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsdasri?.ecoOrganismeSiret,
    skip: sealedFields.includes("ecoOrganismeSiret"),
    setter: (input, companyInput) => {
      if (companyInput.name) {
        input.ecoOrganismeName = companyInput.name;
      }
    }
  },

  {
    siret: bsdasri?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (input, companyInput) => {
      input.brokerCompanyName = companyInput.name;
      input.brokerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsdasri?.traderCompanySiret,
    skip: sealedFields.includes("traderCompanySiret"),
    setter: (input, companyInput) => {
      input.traderCompanyName = companyInput.name;
      input.traderCompanyAddress = companyInput.address;
    }
  },
  ...(bsdasri.intermediaries ?? []).map(
    (_, idx) =>
      ({
        siret: bsdasri.intermediaries![idx].siret,
        skip: sealedFields.includes("intermediaries"),
        setter: (input, companyInput) => {
          const intermediary = input.intermediaries![idx];
          if (companyInput.name) {
            intermediary!.name = companyInput.name;
          }
          if (companyInput.address) {
            intermediary!.address = companyInput.address;
          }
        }
      } as NextCompanyInputAccessor<ParsedZodBsdasri>)
  )
];

export const sirenifyBsdasri = nextBuildSirenify<ParsedZodBsdasri>(
  sirenifyBsdasriAccessors
);
