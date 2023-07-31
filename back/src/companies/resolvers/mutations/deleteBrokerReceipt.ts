import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBrokerReceiptOrNotFound } from "../../database";
import { checkUserPermissions, Permission } from "../../../permissions";

/**
 * Delete a broker receipt
 * @param id
 */
const deleteBrokerReceiptResolver: MutationResolvers["deleteBrokerReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    getBrokerReceiptOrNotFound({ id });
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé courtier`
    );

    return await prisma.brokerReceipt.delete({ where: { id } });
  };

export default deleteBrokerReceiptResolver;
