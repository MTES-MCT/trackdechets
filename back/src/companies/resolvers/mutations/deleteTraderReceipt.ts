import prisma from "src/prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTraderReceiptOrNotFound, stringifyDates } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";

/**
 * Delete a trader receipt
 * @param id
 */
const deleteTransporterReceiptResolver: MutationResolvers["deleteTraderReceipt"] = async (
  parent,
  { input },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id } = input;
  const receipt = await getTraderReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
  const traderReceipt = await prisma.traderReceipt.delete({ where: { id } });
  return stringifyDates(traderReceipt);
};

export default deleteTransporterReceiptResolver;
