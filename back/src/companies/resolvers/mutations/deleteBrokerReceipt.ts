import { prisma } from "@td/prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBrokerReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteBrokerReceipt } from "../../permissions";

/**
 * Delete a broker receipt
 * @param id
 */
const deleteBrokerReceiptResolver: MutationResolvers["deleteBrokerReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    const receipt = await getBrokerReceiptOrNotFound({ id });
    await checkCanReadUpdateDeleteBrokerReceipt(user, receipt);
    return await prisma.brokerReceipt.delete({ where: { id } });
  };

export default deleteBrokerReceiptResolver;
