import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { receiptSchema } from "../../validation";
import { removeEmptyKeys } from "../../../common/converter";
import { checkUserPermissions, Permission } from "../../../permissions";
import { TransporterReceiptNotFound } from "../../errors";

/**
 * Update a transporter receipt
 * @param input
 */
const updateTransporterReceiptResolver: MutationResolvers["updateTransporterReceipt"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, ...data }
    } = args;

    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé transporteur`
    );
    await receiptSchema.validate(data);
    try {
      const company = await prisma.company.update({
        where: { orgId: id },
        data: removeEmptyKeys(data),
        select: {
          transporterReceiptNumber: true,
          transporterReceiptDepartment: true,
          transporterReceiptValidityLimit: true
        }
      });
      return {
        id: id!,
        receiptNumber: company.transporterReceiptNumber!,
        department: company.transporterReceiptDepartment!,
        validityLimit: company.transporterReceiptValidityLimit!
      };
    } catch (_) {
      throw new TransporterReceiptNotFound();
    }
  };

export default updateTransporterReceiptResolver;
