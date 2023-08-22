import {
  CompanyInput,
  BsdasriRecepisseInput
} from "../generated/graphql/types";
import prisma from "../prisma";

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
  return prisma.company.findUnique({
    ...where,
    select: {
      transporterReceiptDepartment: true,
      transporterReceiptValidityLimit: true,
      transporterReceiptNumber: true
    }
  });
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
      // if company exists, we auto-complete
      if (company) {
        let receipt: RecipifyOutput;
        if (!!company?.transporterReceiptNumber) {
          receipt = {
            number: company.transporterReceiptNumber,
            validityLimit: company.transporterReceiptValidityLimit ?? null,
            department: company.transporterReceiptDepartment ?? null
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
