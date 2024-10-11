import { prisma } from "@td/prisma";
import { CompanyRole } from "./zod/schema";

type Receipt = {
  receiptNumber: string;
  validityLimit: Date;
  department: string;
};

export type RecipifyInputAccessor<T> = {
  role: CompanyRole.Transporter | CompanyRole.Broker | CompanyRole.Trader;
  skip: boolean;
  orgIdGetter: () => string | null;
  setter: (input: T, receipt: Receipt | null) => Promise<void>;
};

export const buildRecipify = <T>(
  companyInputAccessors: (
    input: T,
    sealedFields: string[]
  ) => RecipifyInputAccessor<T>[]
): ((bsd: T, sealedFields: string[]) => Promise<T>) => {
  return async (bsd, sealedFields) => {
    const accessors = companyInputAccessors(bsd, sealedFields);
    const recipifiedBsd = { ...bsd };
    for (const { role, skip, setter, orgIdGetter } of accessors) {
      if (skip) {
        continue;
      }
      let receipt: Receipt | null = null;
      const orgId = orgIdGetter();
      if (!orgId) {
        continue;
      }
      if (role === CompanyRole.Transporter) {
        try {
          receipt = await prisma.company
            .findUnique({
              where: {
                orgId
              }
            })
            .transporterReceipt();
        } catch (error) {
          // do nothing
        }
      } else if (role === CompanyRole.Broker) {
        try {
          receipt = await prisma.company
            .findUnique({
              where: {
                orgId
              }
            })
            .brokerReceipt();
        } catch (error) {
          // do nothing
        }
      } else if (role === CompanyRole.Trader) {
        try {
          receipt = await prisma.company
            .findUnique({
              where: {
                orgId
              }
            })
            .traderReceipt();
        } catch (error) {
          // do nothing
        }
      }
      setter(recipifiedBsd, receipt);
    }

    return recipifiedBsd;
  };
};
