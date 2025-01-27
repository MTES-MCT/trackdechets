import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../companies/sirenify";
import { ParsedZodBsvhu } from "./schema";

const sirenifyBsvhuAccessors = (
  bsvhu: ParsedZodBsvhu,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): NextCompanyInputAccessor<ParsedZodBsvhu>[] => [
  {
    siret: bsvhu?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret") || bsvhu.emitterNoSiret,
    setterIfNotRegistered: input => {
      input.emitterNotOnTD = true;
    },
    setter: (input, companyInput) => {
      input.emitterCompanyName = companyInput.name ?? input.emitterCompanyName;
      input.emitterCompanyAddress =
        companyInput.address ?? input.emitterCompanyAddress;
      input.emitterCompanyCity = companyInput.city ?? input.emitterCompanyCity;
      input.emitterCompanyPostalCode =
        companyInput.postalCode ?? input.emitterCompanyPostalCode;
      input.emitterCompanyStreet =
        companyInput.street ?? input.emitterCompanyStreet;
    }
  },
  {
    siret: bsvhu?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsvhu?.destinationOperationNextDestinationCompanySiret,
    skip: sealedFields.includes(
      "destinationOperationNextDestinationCompanySiret"
    ),
    setter: (input, companyInput) => {
      input.destinationOperationNextDestinationCompanyName = companyInput.name;
      input.destinationOperationNextDestinationCompanyAddress =
        companyInput.address;
    }
  },
  {
    siret: bsvhu?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsvhu?.ecoOrganismeSiret,
    skip: sealedFields.includes("ecoOrganismeSiret"),
    setter: (input, companyInput) => {
      if (companyInput.name) {
        input.ecoOrganismeName = companyInput.name;
      }
    }
  },
  {
    siret: bsvhu?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (input, companyInput) => {
      input.brokerCompanyName = companyInput.name;
      input.brokerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsvhu?.traderCompanySiret,
    skip: sealedFields.includes("traderCompanySiret"),
    setter: (input, companyInput) => {
      input.traderCompanyName = companyInput.name;
      input.traderCompanyAddress = companyInput.address;
    }
  },
  ...(bsvhu.intermediaries ?? []).map(
    (_, idx) =>
      ({
        siret: bsvhu.intermediaries![idx].siret,
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
      } as NextCompanyInputAccessor<ParsedZodBsvhu>)
  )
];

export const sirenifyBsvhu = nextBuildSirenify<ParsedZodBsvhu>(
  sirenifyBsvhuAccessors
);
