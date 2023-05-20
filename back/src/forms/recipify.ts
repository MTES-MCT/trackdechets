import {
  FormInput,
  ResealedFormInput,
  NextSegmentInfoInput
} from "../generated/graphql/types";

import { recipifyGeneric } from "../companies/recipify";

// todo: generalize
type Receipt = {
  number?: string | null;
  department?: string | null;
  validityLimit?: Date | null;
};

/**
 * Null if exemption is true
 */
const genericGetter = (input: FormInput) => () =>
  input?.transporter?.isExemptedOfReceipt !== true
    ? input?.transporter?.company
    : null;

const formInputAccessors = (input: FormInput) => [
  {
    getter: genericGetter(input),
    setter: (
      input: FormInput,
      transporterAutocompleted: Receipt
    ): FormInput => {
      const { number, department, validityLimit } = transporterAutocompleted;
      return {
        ...input,
        transporter: {
          ...input.transporter,
          ...{ receipt: number, department, validityLimit }
        }
      };
    }
  }
];
export const recipifyFormInput = recipifyGeneric(formInputAccessors);

const resealedFormInputAccessors = (input: ResealedFormInput) => [
  {
    getter: genericGetter(input),
    setter: (
      input: ResealedFormInput,
      transporterAutocompleted: Receipt
    ): ResealedFormInput => {
      const { number, department, validityLimit } = transporterAutocompleted;
      return {
        ...input,
        transporter: {
          ...input.transporter,
          ...{ receipt: number, department, validityLimit }
        }
      };
    }
  }
];

export const recipifyResealedFormInput = recipifyGeneric(
  resealedFormInputAccessors
);

const transportSegmentInputAccessors = (input: NextSegmentInfoInput) => [
  {
    getter: genericGetter(input),
    setter: (
      input: NextSegmentInfoInput,
      transporterAutocompleted: Receipt
    ): NextSegmentInfoInput => {
      const { number, department, validityLimit } = transporterAutocompleted;
      return {
        ...input,
        transporter: {
          ...input.transporter,
          ...{ receipt: number, department, validityLimit }
        }
      };
    }
  }
];

export const recipifyTransportSegmentInput = recipifyGeneric(
  transportSegmentInputAccessors
);
