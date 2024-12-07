import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../../companies/sirenify";
import type { CompanyInput } from "@td/codegen-back";
import { ParsedZodBsff, ParsedZodBsffTransporter } from "./schema";
import { ZodBsffTransporterTransformer } from "./types";

const sirenifyBsffAccessors = (
  bsff: ParsedZodBsff,
  // Tranformations should not be run on sealed fields
  sealedFields: string[]
): NextCompanyInputAccessor<ParsedZodBsff>[] => [
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

export const sirenifyBsff = nextBuildSirenify<ParsedZodBsff>(
  sirenifyBsffAccessors
);

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
