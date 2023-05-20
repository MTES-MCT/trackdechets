import {
  BsdaInput,
  BsdaRecepisseInput,
  BsdasriInput,
  BsdasriRecepisseInput,
  BsvhuInput,
  BsvhuRecepisseInput
} from "../../generated/graphql/types";

import { recipifyGeneric } from "../../companies/recipify";

/**
 * Generic setter for BSDA, Bsvhu and Bsdasri
 * @param input auto-completed Input
 * @param recepisseInput Original input
 * @returns
 */
export const autocompletedRecepisse = (
  input: BsdaInput | BsvhuInput | BsdasriInput,
  recepisseInput:
    | BsdaRecepisseInput
    | BsvhuRecepisseInput
    | BsdasriRecepisseInput
) => ({
  ...input.transporter?.recepisse,
  ...recepisseInput
});

/**
 * Generic getter for BSDA, Bsvhu and Bsdasri
 * Null when exempted, to avoid unnecessary searching for the receipt when true
 * @param input auto-completed Input
 * @returns
 */
export const genericGetter =
  (input: BsdaInput | BsvhuInput | BsdasriInput) => () =>
    input?.transporter?.recepisse?.isExempted !== true
      ? input?.transporter?.company
      : null;

const bsdaAccessors = (input: BsdaInput) => [
  {
    getter: genericGetter(input),
    setter: (input: BsdaInput, recepisseInput: BsdaRecepisseInput) => ({
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

export const recipify = recipifyGeneric(bsdaAccessors);
