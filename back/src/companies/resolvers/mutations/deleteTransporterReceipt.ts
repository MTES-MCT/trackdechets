import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTransporterReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";

/**
 * Delete a transporter receipt
 * @param id
 */
const deleteTransporterReceiptResolver: MutationResolvers["deleteTransporterReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    const receipt = await getTransporterReceiptOrNotFound({ id });
    await checkCanReadUpdateDeleteTransporterReceipt(user, receipt);
    const transporterReceipt = await prisma.transporterReceipt.delete({
      where: { id }
    });
    return transporterReceipt;
  };

export default deleteTransporterReceiptResolver;
