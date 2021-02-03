import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import {
  getTransporterReceiptOrNotFound,
  stringifyDates
} from "../../database";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";
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
  const transporterReceipt = await prisma.transporterReceipt.update({
    data,
    where: { id }
  });
  return stringifyDates(transporterReceipt);
};

export default updateTransporterReceiptResolver;
