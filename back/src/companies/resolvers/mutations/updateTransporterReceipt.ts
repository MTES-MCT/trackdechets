import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";
import { getTransporterReceiptOrNotFound } from "../../database";

import { receiptSchema } from "../../validation";

/**
 * Update a transporter receipt
 * @param input
 */
const updateTransporterReceiptResolver: MutationResolvers["updateTransporterReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const {
    input: { id, ...data }
  } = args;
  const receipt = await getTransporterReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTransporterReceipt(user, receipt);
  await receiptSchema.validate({ ...receipt, ...data });
  return prisma.updateTransporterReceipt({ data, where: { id } });
};

export default updateTransporterReceiptResolver;
