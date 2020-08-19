import { prisma } from "../../../generated/prisma-client";
import {
  MutationUpdateCompanyArgs,
  CompanyPrivate,
  MutationResolvers
} from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkIsCompanyAdmin } from "../../../users/permissions";

export async function updateCompanyFn({
  siret,
  companyTypes,
  gerepId,
  contactEmail,
  contactPhone,
  website,
  givenName,
  transporterReceiptId,
  traderReceiptId
}: MutationUpdateCompanyArgs): Promise<CompanyPrivate> {
  const data = {
    ...(companyTypes !== undefined
      ? { companyTypes: { set: companyTypes } }
      : {}),
    ...(gerepId !== undefined ? { gerepId } : {}),
    ...(contactEmail !== undefined ? { contactEmail } : {}),
    ...(contactPhone !== undefined ? { contactPhone } : {}),
    ...(website !== undefined ? { website } : {}),
    ...(givenName !== undefined ? { givenName } : {}),
    ...(transporterReceiptId
      ? { transporterReceipt: { connect: { id: transporterReceiptId } } }
      : {}),
    ...(traderReceiptId
      ? { traderReceipt: { connect: { id: traderReceiptId } } }
      : {})
  };

  return prisma.updateCompany({
    where: { siret },
    data
  });
}

const updateCompanyResolver: MutationResolvers["updateCompany"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret: args.siret });
  await checkIsCompanyAdmin(user, company);
  return updateCompanyFn(args);
};

export default updateCompanyResolver;
