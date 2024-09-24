import { ParsedZodBsda, ParsedZodBsdaTransporter } from "./schema";
import { CompanyInput } from "../../generated/graphql/types";
import {
  nextBuildSirenify,
  NextCompanyInputAccessor
} from "../../companies/sirenify";
import { getSealedFields } from "./rules";
import {
  BsdaValidationContext,
  ZodBsdaTransformer,
  ZodBsdaTransporterTransformer
} from "./types";

const sirenifyBsdaAccessors = (
  bsda: ParsedZodBsda,
  sealedFields: string[] // Tranformations should not be run on sealed fields
): NextCompanyInputAccessor<ParsedZodBsda>[] => [
  {
    siret: bsda?.emitterCompanySiret,
    skip: sealedFields.includes("emitterCompanySiret"),
    setter: (input, companyInput) => {
      input.emitterCompanyName = companyInput.name;
      input.emitterCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.destinationCompanySiret,
    skip: sealedFields.includes("destinationCompanySiret"),
    setter: (input, companyInput) => {
      input.destinationCompanyName = companyInput.name;
      input.destinationCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.workerCompanySiret,
    skip: sealedFields.includes("workerCompanySiret"),
    setter: (input, companyInput) => {
      input.workerCompanyName = companyInput.name;
      input.workerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.brokerCompanySiret,
    skip: sealedFields.includes("brokerCompanySiret"),
    setter: (input, companyInput) => {
      input.brokerCompanyName = companyInput.name;
      input.brokerCompanyAddress = companyInput.address;
    }
  },
  {
    siret: bsda?.ecoOrganismeSiret,
    isEcoOrganisme: true,
    skip: sealedFields.includes("ecoOrganismeSiret"),
    setter: (input, companyInput) => {
      input.ecoOrganismeName = companyInput.name;
    }
  },
  ...(bsda.intermediaries ?? []).map(
    (_, idx) =>
      ({
        siret: bsda.intermediaries![idx].siret,
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
      } as NextCompanyInputAccessor<ParsedZodBsda>)
  ),
  ...(bsda.transporters ?? []).map(
    (_, idx) =>
      ({
        siret: bsda.transporters![idx].transporterCompanySiret,
        // FIXME skip conditionnaly based on transporter signatures
        skip: false,
        setter: (input, companyInput) => {
          const transporter = input.transporters![idx];
          if (companyInput.name) {
            transporter!.transporterCompanyName = companyInput.name;
          }
          if (companyInput.address) {
            transporter!.transporterCompanyAddress = companyInput.address;
          }
        }
      } as NextCompanyInputAccessor<ParsedZodBsda>)
  )
];

export const sirenifyBsda: (
  context: BsdaValidationContext
) => ZodBsdaTransformer = context => {
  return async bsda => {
    const sealedFields = await getSealedFields(bsda, context);
    return nextBuildSirenify<ParsedZodBsda>(sirenifyBsdaAccessors)(
      bsda,
      sealedFields
    );
  };
};

const sirenifyBsdaTransporterAccessors = (
  bsdaTransporter: ParsedZodBsdaTransporter
) => [
  {
    siret: bsdaTransporter.transporterCompanySiret,
    setter: (input: ParsedZodBsdaTransporter, companyInput: CompanyInput) => {
      input.transporterCompanyName = companyInput.name;
      input.transporterCompanyAddress = companyInput.address;
    },
    skip: false
  }
];

export const sirenifyBsdaTransporter: ZodBsdaTransporterTransformer =
  bsdaTransporter =>
    nextBuildSirenify<ParsedZodBsdaTransporter>(
      sirenifyBsdaTransporterAccessors
    )(bsdaTransporter, []);
