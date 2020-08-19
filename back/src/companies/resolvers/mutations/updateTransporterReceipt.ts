import {
  MutationResolvers,
  MutationUpdateTransporterReceiptArgs
} from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanReadUpdateDeleteTransporterReceipt } from "../../permissions";
import { getTransporterReceiptOrNotFound } from "../../database";
import { isValidDatetime } from "../../../forms/validation";
import { InvalidDateTime } from "../../../common/errors";

function validateArgs(args: MutationUpdateTransporterReceiptArgs) {
  if (args.input.validityLimit) {
    const validityLimit = args.input.validityLimit;
    if (!isValidDatetime(validityLimit)) {
      throw new InvalidDateTime("validityLimit");
    }
  }
  return args;
}

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
  } = validateArgs(args);
  const receipt = await getTransporterReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTransporterReceipt(user, receipt);
  return prisma.updateTransporterReceipt({ data, where: { id } });
};

export default updateTransporterReceiptResolver;
