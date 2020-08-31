import {
  MutationResolvers,
  MutationCreateTransporterReceiptArgs
} from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { isValidDatetime } from "../../../forms/validation";
import { InvalidDateTime } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";

function validateArgs(args: MutationCreateTransporterReceiptArgs) {
  if (!isValidDatetime(args.input.validityLimit)) {
    throw new InvalidDateTime("validityLimit");
  }
  return args;
}

/**
 * Create a transporter receipt
 * @param input
 */
const createTransporterReceiptResolver: MutationResolvers["createTransporterReceipt"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAuthenticated(context);
  const { input } = validateArgs(args);
  return prisma.createTransporterReceipt(input);
};

export default createTransporterReceiptResolver;
