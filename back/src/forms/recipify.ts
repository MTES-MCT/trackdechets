import type {
  FormInput,
  ResealedFormInput,
  NextSegmentInfoInput,
  TransporterInput
} from "@td/codegen-back";

import { recipifyGeneric } from "../companies/recipify";
import { BsddTransporter, Prisma } from "@td/prisma";
import { prisma } from "@td/prisma";

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

export const recipifyFormInput = async (input: FormInput) => {
  let recipified = input;

  if (input.transporter?.company?.siret) {
    const transporterCompany = await prisma.company.findFirst({
      where: { orgId: input.transporter.company.siret },
      include: { transporterReceipt: true }
    });
    if (transporterCompany) {
      recipified = {
        ...recipified,
        transporter: {
          ...input.transporter,
          receipt: transporterCompany.transporterReceipt?.receiptNumber ?? null,
          department: transporterCompany.transporterReceipt?.department ?? null,
          validityLimit:
            transporterCompany.transporterReceipt?.validityLimit ?? null
        }
      };
    }
  }

  if (input.trader?.company?.siret) {
    const traderCompany = await prisma.company.findFirst({
      where: { orgId: input.trader.company.siret },
      include: { traderReceipt: true }
    });
    if (traderCompany) {
      recipified = {
        ...recipified,
        trader: {
          ...input.trader,
          receipt: traderCompany.traderReceipt?.receiptNumber ?? null,
          department: traderCompany.traderReceipt?.department ?? null,
          validityLimit: traderCompany.traderReceipt?.validityLimit ?? null
        }
      };
    }
  }

  if (input.broker?.company?.siret) {
    const brokerCompany = await prisma.company.findFirst({
      where: { orgId: input.broker.company.siret },
      include: { brokerReceipt: true }
    });
    if (brokerCompany) {
      recipified = {
        ...recipified,
        broker: {
          ...input.broker,
          receipt: brokerCompany.brokerReceipt?.receiptNumber ?? null,
          department: brokerCompany.brokerReceipt?.department ?? null,
          validityLimit: brokerCompany?.brokerReceipt?.validityLimit ?? null
        }
      };
    }
  }

  return recipified;
};

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
