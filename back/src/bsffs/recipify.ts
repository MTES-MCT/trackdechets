import {
  BsffInput,
  BsffTransporterRecepisseInput
} from "../generated/graphql/types";

import { recipifyGeneric } from "../companies/recipify";

const bsffAccessors = (input: BsffInput) => [
  {
    getter: () =>
      // Old way of exempting is null
      input?.transporter?.recepisse !== null &&
      // New way added to the old
      input?.transporter?.recepisse?.isExempted !== true
        ? input?.transporter?.company
        : null,
    setter: (
      input: BsffInput,
      recepisseInput: BsffTransporterRecepisseInput
    ) => ({
      ...input,
      transporter: {
        ...input.transporter,
        recepisse: {
          ...input.transporter?.recepisse,
          ...recepisseInput
        }
      }
    })
  }
];

export const recipify = recipifyGeneric(bsffAccessors);
