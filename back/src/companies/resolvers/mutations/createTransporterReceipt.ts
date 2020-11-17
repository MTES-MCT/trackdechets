import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "src/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { receiptSchema } from "../../validation";
import { stringifyDates } from "src/companies/database";

/**
 * Create a transporter receipt
 * @param input
 */
const createTransporterReceiptResolver: MutationResolvers["createTransporterReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const { input } = args;
  await receiptSchema.validate(input);
  const transporterReceipt = await prisma.transporterReceipt.create({
    data: input
  });
  return stringifyDates(transporterReceipt);
};

export default createTransporterReceiptResolver;
