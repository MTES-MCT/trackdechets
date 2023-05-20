import { BsvhuInput, BsvhuRecepisseInput } from "../generated/graphql/types";

import { recipifyGeneric } from "../companies/recipify";
import {
  autocompletedRecepisse,
  genericGetter
} from "../bsda/validation/recipify";

const bsvhuAccessors = (input: BsvhuInput) => [
  {
    getter: genericGetter(input),
    setter: (input: BsvhuInput, recepisseInput: BsvhuRecepisseInput) => ({
      ...input,
      transporter: {
        company: input.transporter?.company,
        transport: input.transporter?.transport,
        recepisse: autocompletedRecepisse(input, recepisseInput)
      }
    })
  }
];

export const recipify = recipifyGeneric(bsvhuAccessors);
