import { nextBuildSirenify } from "../../companies/sirenify";
import { CompanyInput } from "../../generated/graphql/types";
import { getSealedFields } from "./rules";
import { ParsedZodBsvhu } from "./schema";
import { BsvhuValidationContext, ZodBsvhuTransformer } from "./types";

const sirenifyBsvhuAccessors = (
  bsvhu: ParsedZodBsvhu,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
) => [
  {
    siret: bsvhu?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret") || bsvhu.emitterNoSiret,
    setter: (input, companyInput: CompanyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsvhu?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsvhu?.destinationOperationNextDestinationCompanySiret,
    skip: sealedFields.includes(
      "destinationOperationNextDestinationCompanySiret"
    ),
    setter: (input, companyInput: CompanyInput) => {
      input.destinationOperationNextDestinationCompanyName = companyInput.name;
      input.destinationOperationNextDestinationCompanyAddress =
        companyInput.address;
    }
  },
  {
    siret: bsvhu?.transporterCompanySiret,
    skip: sealedFields.includes("transporterCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    }
  }
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
