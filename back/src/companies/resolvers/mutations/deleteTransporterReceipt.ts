import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import { TransporterReceiptNotFound } from "../../errors";

/**
 * Delete a transporter receipt
 * @param id
 */
const deleteTransporterReceiptResolver: MutationResolvers["deleteTransporterReceipt"] =
  async (parent, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id } = input;
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé transporteur`
    );
    try {
      const company = await prisma.company.update({
        where: { orgId: id },
        data: {
          transporterReceiptNumber: null,
          transporterReceiptDepartment: null,
          transporterReceiptValidityLimit: null
        },
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

export default deleteTransporterReceiptResolver;
