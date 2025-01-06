import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { getTraderReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";
import { receiptSchema } from "../../validation";
import { removeEmptyKeys } from "../../../common/converter";

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
    const receipt = await getTraderReceiptOrNotFound({ id });
    await receiptSchema.validate({ ...receipt, ...data });
    await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
    const traderReceipt = await prisma.traderReceipt.update({
      data: removeEmptyKeys(data),
      where: { id: receipt.id }
    });
    return traderReceipt;
  };

export default updateTraderReceiptResolver;
