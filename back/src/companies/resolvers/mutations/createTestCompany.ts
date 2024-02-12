import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { luhnCheckSum, TEST_COMPANY_PREFIX } from "@td/constants";
import { randomNbrChain } from "../../../utils";

/**
 * Generates a new test siret. Will create a random, VALID siret with a test prefix,.
 */
export const generateRandomTestSiret = () => {
  // https://github.com/MathieuDerelle/vat-siren-siret/blob/master/lib/vss.rb#L119
  const chain = `${TEST_COMPANY_PREFIX}${randomNbrChain(6)}`;
  const rest = 10 - (luhnCheckSum(chain) % 10);
  const a = Math.floor(rest / 3);
  const b = rest > 2 ? rest - 2 * a : rest;

  return `${chain}${a}${b}`;
};

/**
 * Generates a unique test siret. Will check in the DB if such siret already exists.
 */
export async function generateUniqueTestSiret() {
  const randomSiret = generateRandomTestSiret();

  const testCompany = await prisma.anonymousCompany.findFirst({
    where: { siret: randomSiret }
  });

  // There's already a a company with this random siret.
  // Try again.
  if (testCompany) {
    return generateUniqueTestSiret();
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
    siret: await generateUniqueTestSiret(),
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
