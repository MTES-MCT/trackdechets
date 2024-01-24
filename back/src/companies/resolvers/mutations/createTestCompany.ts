import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { TEST_COMPANY_PREFIX } from "@td/constants";

/**
 * Generate a new test siret by incrementing last generated siret
 * The generated sequence will look like this:
 * 00000000000001, 00000000000002, ..., 00000000000010
 * Calling this function to create a new test company is not thread safe
 * as we may encounter a race condition where two users try to create a
 * test company with the same siret.
 * In the worst case scenario, one of the user will get an error, retry,
 * and get a valid siret
 */
export async function generateTestSiret() {
  const testCompanies = await prisma.anonymousCompany.findMany({
    orderBy: { siret: "desc" },
    where: { siret: { startsWith: TEST_COMPANY_PREFIX } }
  });
  if (testCompanies.length === 0) {
    return "00000000000001";
  }
  const last = testCompanies[0];
  return (Number(last.siret) + 1).toString().padStart(14, "0");
}

// auto-generated data for test companies
const fixtures = {
  name: "Établissement de test",
  address: "Adresse test",
  codeNaf: "XXXXX",
  libelleNaf: "Entreprise de test",
  codeCommune: "00000"
};

const createTestCompany: MutationResolvers["createTestCompany"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const createInput = {
    siret: await generateTestSiret(),
    ...fixtures
  };
  const company = await prisma.anonymousCompany.create({
    data: {
      ...createInput,
      orgId: createInput.siret
    }
  });
  return company.siret!;
};

export default createTestCompany;
