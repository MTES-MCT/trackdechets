import {
  MutationResolvers,
  MutationCreateTraderReceiptArgs
} from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isValidDatetime } from "../../../forms/validation";
import { InvalidDateTime } from "../../../common/errors";

function validateArgs(args: MutationCreateTraderReceiptArgs) {
  if (!isValidDatetime(args.input.validityLimit)) {
    throw new InvalidDateTime("validityLimit");
  }
  return args;
}

/**
 * Create a trader receipt
 * @param input
 */
const createTraderReceiptResolver: MutationResolvers["createTraderReceipt"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const { input } = validateArgs(args);
  return prisma.createTraderReceipt(input);
};

export default createTraderReceiptResolver;
