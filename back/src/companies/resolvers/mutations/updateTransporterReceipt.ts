import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getTransporterReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";
import { receiptSchema } from "../../validation";
import { removeEmptyKeys } from "../../../common/converter";

/**
 * Update a transporter receipt
 * @param input
 */
const updateTransporterReceiptResolver: MutationResolvers["updateTransporterReceipt"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [
      AuthType.Session,
      // On autorise une modification du récépissé de transport par API
      AuthType.Bearer
    ]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, ...data }
    } = args;
    const receipt = await getTransporterReceiptOrNotFound({ id });
    await checkCanReadUpdateDeleteTransporterReceipt(user, receipt);
    await receiptSchema.validate({ ...receipt, ...data });
    const transporterReceipt = await prisma.transporterReceipt.update({
      data: removeEmptyKeys(data),
      where: { id }
    });
    return transporterReceipt;
  };

export default updateTransporterReceiptResolver;
