import { nextBuildSirenify } from "../../../companies/sirenify";
import { CompanyInput } from "../../../generated/graphql/types";
import { getSealedFields } from "./rules";
import { ParsedZodBsff, ParsedZodBsffTransporter } from "./schema";
import {
  BsffValidationContext,
  ZodBsffTransformer,
  ZodBsffTransporterTransformer
} from "./types";

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

const sirenifyBsffTransporterAccessors = (
  bsffTransporter: ParsedZodBsffTransporter
) => [
  {
    siret: bsffTransporter.transporterCompanySiret,
    setter: (input: ParsedZodBsffTransporter, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    },
    skip: false
  }
];

export const sirenifyBsffTransporter: ZodBsffTransporterTransformer =
  bsffTransporter =>
    nextBuildSirenify<ParsedZodBsffTransporter>(
      sirenifyBsffTransporterAccessors
    )(bsffTransporter, []);
