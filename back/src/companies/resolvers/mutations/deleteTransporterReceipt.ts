import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getTransporterReceiptOrNotFound,
  stringifyDates
} from "../../database";
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
  const transporterReceipt = await prisma.transporterReceipt.delete({
    where: { id }
  });
  return stringifyDates(transporterReceipt);
};

export default deleteTransporterReceiptResolver;
