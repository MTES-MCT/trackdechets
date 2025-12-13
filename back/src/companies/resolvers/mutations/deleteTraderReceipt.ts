import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTraderReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";
import { checkHasSomePermission, Permission } from "../../../permissions";

/**
 * Delete a trader receipt
 * @param id
 */
const deleteTraderReceiptResolver: MutationResolvers["deleteTraderReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    await checkHasSomePermission(
      user,
      [Permission.CompanyCanUpdate],
      "Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant"
    );

    const { id } = input;
    const receipt = await getTraderReceiptOrNotFound({ id });
    await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
    return prisma.traderReceipt.delete({ where: { id } });
  };

export default deleteTraderReceiptResolver;
