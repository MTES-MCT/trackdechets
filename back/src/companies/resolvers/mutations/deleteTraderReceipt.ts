import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import { TraderReceiptNotFound } from "../../errors";

/**
 * Delete a trader receipt
 * @param id
 */
const deleteTraderReceiptResolver: MutationResolvers["deleteTraderReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant`
    );
    const company = await prisma.company.update({
      where: { orgId: id },
      data: {
        traderReceiptDepartment: null,
        traderReceiptValidityLimit: null,
        traderReceiptNumber: null
      },
      select: {
        traderReceiptNumber: true,
        traderReceiptDepartment: true,
        traderReceiptValidityLimit: true
      }
    });
    if (company == null || !company.traderReceiptNumber) {
      throw new TraderReceiptNotFound();
    }
    return {
      id: id!,
      receiptNumber: company.traderReceiptNumber!,
      department: company.traderReceiptDepartment!,
      validityLimit: company.traderReceiptValidityLimit!
    };
  };

export default deleteTraderReceiptResolver;
