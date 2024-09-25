import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../companies/sirenify";
import { getSealedFields } from "./rules";
import { ParsedZodBsvhu } from "./schema";
import { BsvhuValidationContext, ZodBsvhuTransformer } from "./types";

const sirenifyBsvhuAccessors = (
  bsvhu: ParsedZodBsvhu,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): NextCompanyInputAccessor<ParsedZodBsvhu>[] => [
  {
    siret: bsvhu?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret") || bsvhu.emitterNoSiret,
    setter: (input, companyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
      input.emitterCompanyCity = companyInput.city;
      input.emitterCompanyPostalCode = companyInput.postalCode;
      input.emitterCompanyStreet = companyInput.street;
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

export const sirenifyBsvhu: (
  context: BsvhuValidationContext
) => ZodBsvhuTransformer = context => {
  return async bsvhu => {
    const sealedFields = await getSealedFields(bsvhu, context);
    return nextBuildSirenify<ParsedZodBsvhu>(sirenifyBsvhuAccessors)(
      bsvhu,
      sealedFields
    );
  };
};
