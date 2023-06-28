import { UserInputError } from "apollo-server-express";
import {
  CompanyInput,
  BsdasriRecepisseInput
} from "../generated/graphql/types";
import prisma from "../prisma";
import { missingCompanyError } from "../common/validation/siret";

type RecipifyOutput = {
  number: string | null;
  validityLimit: Date | null;
  department: string | null;
};

type RecipifyFn<T> = (input: T) => Promise<T>;

type RecepisseInputAccessor<T> = {
  getter: () => CompanyInput | null | undefined;
  setter: (input: T, recepisseInput: BsdasriRecepisseInput) => T;
};

/**
 * Search a Company.transporterReceiptId within 1 sec or throw an error
 */
export async function findCompanyFailFast(orgId: string) {
  const where = {
    where: { orgId }
  };
  // make sure we do not wait more thant 1s here to avoid bottlenecks
  const raceWith = new Promise<null>(resolve =>
    setTimeout(resolve, 1000, null)
  );

  try {
    return Promise.race([findCompany(where), raceWith]);
  } catch (e) {
    return null;
  }
}

function findCompany(where: { where: { orgId: string } }) {
  try {
    return prisma.company.findUniqueOrThrow({
      ...where,
      select: {
        transporterReceiptId: true
      }
    });
  } catch (e) {
    throw new UserInputError(missingCompanyError(where.where.orgId));
  }
}

export function recipifyGeneric<T>(
  recepisseInputAccessors: (input: T) => RecepisseInputAccessor<T>[]
): RecipifyFn<T> {
  return async input => {
    const accessors = recepisseInputAccessors(input);
    const companyInputs = accessors.map(({ getter }) => getter());

    const companies = await Promise.all(
      companyInputs.map(companyInput =>
        companyInput && (companyInput.siret || companyInput.vatNumber)
          ? findCompanyFailFast(companyInput.siret ?? companyInput.vatNumber!)
          : null
      )
    );

    let completedInput = { ...input };
    for (const [idx, company] of companies.entries()) {
      const { setter } = accessors[idx];
      if (company) {
        let receipt: RecipifyOutput;
        if (!!company?.transporterReceiptId) {
          const dbReceipt = await prisma.transporterReceipt.findFirst({
            where: { id: company.transporterReceiptId },
            select: {
              receiptNumber: true,
              validityLimit: true,
              department: true
            }
          });
          receipt = {
            number: dbReceipt?.receiptNumber ?? null,
            validityLimit: dbReceipt?.validityLimit ?? null,
            department: dbReceipt?.department ?? null
          };
        } else {
          receipt = {
            number: null,
            validityLimit: null,
            department: null
          };
        }

        completedInput = setter(completedInput, receipt);
      }
    }

    return completedInput;
  };
}
