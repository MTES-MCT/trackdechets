import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBrokerReceiptOrNotFound } from "../../database";
import { receiptSchema } from "../../validation";
import { removeEmptyKeys } from "../../../common/converter";
import { checkUserPermissions, Permission } from "../../../permissions";

/**
 * Update a broker receipt
 * @param input
 */
const updateBrokerReceiptResolver: MutationResolvers["updateBrokerReceipt"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, ...data }
    } = args;
    const receipt = await getBrokerReceiptOrNotFound({ id });
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé courtier`
    );

    await receiptSchema.validate({ ...receipt, ...data });
    return await prisma.brokerReceipt.update({
      data: removeEmptyKeys(data),
      where: { id: receipt.id }
    });
  };

export default updateBrokerReceiptResolver;
