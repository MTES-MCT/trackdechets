import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { receiptSchema } from "../../validation";
import { checkUserPermissions, Permission } from "../../../permissions";
import { TraderReceiptNotFound } from "../../errors";

/**
 * Update a trader receipt
 * @param input
 */
const updateTraderReceiptResolver: MutationResolvers["updateTraderReceipt"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, ...data }
    } = args;
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant`
    );
    await receiptSchema.validate(data);

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

export default updateTraderReceiptResolver;
