import { nextBuildSirenify } from "../../../companies/sirenify";
import { CompanyInput } from "../../../generated/graphql/types";
import { getSealedFields } from "./rules";
import { ParsedZodBsff } from "./schema";
import { BsffValidationContext, ZodBsffTransformer } from "./types";

const sirenifyBsffAccessors = (
  bsff: ParsedZodBsff,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
) => [
  {
    siret: bsff?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsff?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput: CompanyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  ...(bsff.transporters ?? []).map((_, idx) => ({
    siret: bsff.transporters![idx].transporterCompanySiret,
    // FIXME skip conditionnaly based on transporter signatures
    skip: false,
    setter: (input, companyInput: CompanyInput) => {
      const transporter = input.transporters[idx];
      transporter.transporterCompanyName = companyInput.name;
      transporter.transporterCompanyAddress = companyInput.address;
    }
  }))
];

export const sirenifyBsff: (
  context: BsffValidationContext
) => ZodBsffTransformer = context => {
  return async bsff => {
    const sealedFields = await getSealedFields(bsff, context);
    return nextBuildSirenify<ParsedZodBsff>(sirenifyBsffAccessors)(
      bsff,
      sealedFields
    );
  };
};
