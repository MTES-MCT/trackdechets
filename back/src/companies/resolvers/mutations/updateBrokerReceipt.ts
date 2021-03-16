import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getBrokerReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteBrokerReceipt } from "../../permissions";
import { receiptSchema } from "../../validation";

/**
 * Update a broker receipt
 * @param input
 */
const updateBrokerReceiptResolver: MutationResolvers["updateBrokerReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const {
    input: { id, ...data }
  } = args;
  const receipt = await getBrokerReceiptOrNotFound({ id });
  await receiptSchema.validate({ ...receipt, ...data });
  await checkCanReadUpdateDeleteBrokerReceipt(user, receipt);
  return await prisma.brokerReceipt.update({
    data,
    where: { id: receipt.id }
  });
};

export default updateBrokerReceiptResolver;
