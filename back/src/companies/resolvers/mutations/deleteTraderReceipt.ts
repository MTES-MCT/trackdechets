import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTraderReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";

/**
 * Delete a trader receipt
 * @param id
 */
const deleteTraderReceiptResolver: MutationResolvers["deleteTraderReceipt"] = async (
  parent,
  { input },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id } = input;
  const receipt = await getTraderReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
  return prisma.traderReceipt.delete({ where: { id } });
};

export default deleteTraderReceiptResolver;
