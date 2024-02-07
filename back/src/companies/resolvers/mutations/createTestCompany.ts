import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { TEST_COMPANY_PREFIX } from "@td/constants";
import { randomNbrChain } from "../../../utils";

/**
 * Generates a new test siret. Will create a random siret with a test prefix,
 * then check in the DB if such siret already exists. In that case, will try again.
 */
export async function generateTestSiret() {
  const randomSiret = `${TEST_COMPANY_PREFIX}${randomNbrChain(8)}`;

  const testCompany = await prisma.anonymousCompany.findFirst({
    where: { siret: randomSiret }
  });

  // There's already a a company with this random siret.
  // Try again.
  if (testCompany) {
    return generateTestSiret();
  }

  return randomSiret;
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
