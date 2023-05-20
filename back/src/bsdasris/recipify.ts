import {
  BsdasriInput,
  BsdasriRecepisseInput
} from "../generated/graphql/types";
import { recipifyGeneric } from "../companies/recipify";
import {
  autocompletedRecepisse,
  genericGetter
} from "../bsda/validation/recipify";

const dasriAccessors = (input: BsdasriInput) => [
  {
    getter: genericGetter(input),
    setter: (input: BsdasriInput, recepisseInput: BsdasriRecepisseInput) => ({
      ...input,
      transporter: {
        company: input.transporter?.company,
        transport: input.transporter?.transport,
        customInfo: input.transporter?.customInfo,
        recepisse: autocompletedRecepisse(input, recepisseInput)
      }
    })
  }
];

export const recipify = recipifyGeneric(dasriAccessors);
