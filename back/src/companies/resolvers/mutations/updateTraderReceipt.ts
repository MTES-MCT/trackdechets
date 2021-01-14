import prisma from "src/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getTraderReceiptOrNotFound, stringifyDates } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";
import { receiptSchema } from "../../validation";

/**
 * Update a trader receipt
 * @param input
 */
const updateTraderReceiptResolver: MutationResolvers["updateTraderReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const {
    input: { id, ...data }
  } = args;
  const receipt = await getTraderReceiptOrNotFound({ id });
  await receiptSchema.validate({ ...receipt, ...data });
  await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
  const traderReceipt = await prisma.traderReceipt.update({
    data,
    where: { id: receipt.id }
  });
  return stringifyDates(traderReceipt);
};

export default updateTraderReceiptResolver;
