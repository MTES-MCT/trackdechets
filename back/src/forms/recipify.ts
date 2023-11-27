import {
  FormInput,
  ResealedFormInput,
  NextSegmentInfoInput,
  TransporterInput
} from "../generated/graphql/types";

import { recipifyGeneric } from "../companies/recipify";
import { BsddTransporter, Prisma } from "@prisma/client";

type Receipt = {
  number?: string | null;
  department?: string | null;
  validityLimit?: Date | null;
};

/**
 * Null if exemption is true OR if transporter company has not changed
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

const transporterInputAccessors = (input: TransporterInput) => [
  {
    getter: () => (input.isExemptedOfReceipt !== true ? input.company : null),
    setter: (
      input: TransporterInput,
      transporterAutocompleted: Receipt
    ): TransporterInput => {
      const { number, department, validityLimit } = transporterAutocompleted;
      return {
        ...input,
        ...{ receipt: number, department, validityLimit }
      };
    }
  }
];

export const recipifyTransporterInput = recipifyGeneric(
  transporterInputAccessors
);

/**
 * Used to update the transporteur receipt
 * when no FormInput and recipify function above are unusable
 * @param transporter BsddTransporter
 * @returns Prisma Update payload
 */
export async function recipifyTransporterInDb(
  transporter: BsddTransporter | null
): Promise<{
  transporters: {
    update: Prisma.BsddTransporterUpdateWithWhereUniqueWithoutFormInput;
  };
}> {
  let formUpdateInput;

  if (transporter) {
    const recipifiedTransporter = await recipifyFormInput({
      transporter: {
        isExemptedOfReceipt: transporter.transporterIsExemptedOfReceipt,
        receipt: transporter.transporterReceipt,
        validityLimit: transporter.transporterValidityLimit,
        department: transporter.transporterDepartment,
        company: {
          siret: transporter.transporterCompanySiret,
          vatNumber: transporter.transporterCompanyVatNumber
        }
      }
    });
    const update: Prisma.BsddTransporterUpdateWithWhereUniqueWithoutFormInput =
      {
        data: {
          transporterReceipt:
            recipifiedTransporter.transporter?.receipt ?? null,
          transporterDepartment:
            recipifiedTransporter.transporter?.department ?? null,
          transporterValidityLimit:
            recipifiedTransporter.transporter?.validityLimit ?? null,
          transporterIsExemptedOfReceipt:
            recipifiedTransporter.transporter?.isExemptedOfReceipt ?? null
        },
        where: { id: transporter.id }
      };
    formUpdateInput = {
      transporters: {
        update
      }
    };
  }
  return formUpdateInput;
}
