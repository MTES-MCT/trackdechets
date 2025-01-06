import { nextBuildSirenify } from "../../../companies/sirenify";
import type { CompanyInput } from "@td/codegen-back";
import { ParsedZodBsffPackaging } from "./schema";
import { ZodBsffPackagingTransformer } from "./types";

const sirenifyBsffPackagingAccessors = (
  bsffPackaging: ParsedZodBsffPackaging
) => [
  {
    siret: bsffPackaging?.operationNextDestinationCompanySiret,
    skip: false,
    setter: (input, companyInput: CompanyInput) => {
      input.operationNextDestinationCompanyName = companyInput.name;
      input.operationNextDestinationCompanyAddress = companyInput.address;
    }
  }
];

export const sirenifyBsffPackaging: ZodBsffPackagingTransformer =
  async bsffPackaging => {
    return nextBuildSirenify<ParsedZodBsffPackaging>(
      sirenifyBsffPackagingAccessors
    )(bsffPackaging, []);
  };
