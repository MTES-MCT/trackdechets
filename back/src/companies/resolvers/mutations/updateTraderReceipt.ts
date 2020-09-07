import {
  MutationResolvers,
  MutationUpdateTraderReceiptArgs
} from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { AuthType, applyAuthStrategies } from "../../../auth";
import { isValidDatetime } from "../../../forms/validation";
import { InvalidDateTime } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getTraderReceiptOrNotFound } from "../../database";
import { checkCanReadUpdateDeleteTraderReceipt } from "../../permissions";

function validateArgs(args: MutationUpdateTraderReceiptArgs) {
  if (args.input.validityLimit) {
    const validityLimit = args.input.validityLimit;
    if (!isValidDatetime(validityLimit)) {
      throw new InvalidDateTime("validityLimit");
    }
  }
  return args;
}

/**
 * Update a trader receipt
 * @param input
 */
const updateTraderReceiptResolver: MutationResolvers["updateTraderReceipt"] = async (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const {
    input: { id, ...data }
  } = validateArgs(args);
  const receipt = await getTraderReceiptOrNotFound({ id });
  await checkCanReadUpdateDeleteTraderReceipt(user, receipt);
  return prisma.updateTraderReceipt({ data, where: { id: receipt.id } });
};

export default updateTraderReceiptResolver;
