import { prisma } from "../../../generated/prisma-client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTransporterReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";

/**
 * Delete a transporter receipt
 * @param id
 */
const deleteTransporterReceiptResolver: MutationResolvers["deleteTransporterReceipt"] = async (
  parent,
  { input },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const { id } = input;
  const receipt = await getTransporterReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTransporterReceipt(user, receipt);
  return prisma.deleteTransporterReceipt({ id });
};

export default deleteTransporterReceiptResolver;
