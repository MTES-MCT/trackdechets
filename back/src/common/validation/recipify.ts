import {
  BsdaInput,
  BsdasriInput,
  BsdasriRecepisseInput,
  BsvhuInput,
  BsvhuRecepisseInput
} from "../../generated/graphql/types";

import { recipifyGeneric } from "../../companies/recipify";

/**
 * Generic setter for Bsvhu and Bsdasri
 * @param input auto-completed Input
 * @param recepisseInput Original input
 * @returns
 */
export const autocompletedRecepisse = (
  input: BsvhuInput | BsdasriInput,
  recepisseInput: BsvhuRecepisseInput | BsdasriRecepisseInput
) => ({
  ...input.transporter?.recepisse,
  ...recepisseInput
});

/**
 * Generic getter for Bsda, Bsvhu and Bsdasri
 * Null when exempted or if transporter company has not changed
 * @param input auto-completed Input
 * @returns
 */
export const genericGetter = (input: BsvhuInput | BsdasriInput) => () =>
  input?.transporter?.recepisse?.isExempted !== true
    ? input?.transporter?.company
    : null;

const accessors = (input: BsdaInput) => [
  {
    getter: genericGetter(input),
    setter: (
      input: BsvhuInput | BsdasriInput,
      recepisseInput: BsvhuRecepisseInput | BsdasriRecepisseInput
    ) => ({
      ...input,
      transporter: {
        company: input.transporter?.company,
        transport: input.transporter?.transport,
        recepisse: autocompletedRecepisse(input, recepisseInput)
      }
    })
  }
];

export const recipify = recipifyGeneric(accessors);
