import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkUserPermissions, Permission } from "../../../permissions";
import { VhuAgrementNotFound } from "../../errors";

/**
 * Update a VHU agrement
 * @param input
 */
const updateVhuAgrementResolver: MutationResolvers["updateVhuAgrement"] =
  async (_, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const {
      input: { id, type, ...data }
    } = args;
    await checkUserPermissions(
      user,
      [id],
      Permission.CompanyCanUpdate,
      `Vous n'avez pas le droit d'éditer ou supprimer cet agrément VHU`
    );

    try {
      const company = await prisma.company.update({
        where: { orgId: id },
        data: {
          ...(type === "BROYEUR"
            ? {
                vhuAgrementBroyeurNumber: data.agrementNumber,
                vhuAgrementBroyeurDepartment: data.department
              }
            : {
                vhuAgrementDemolisseurNumber: data.agrementNumber,
                vhuAgrementDemolisseurDepartment: data.department
              })
        },
        select: {
          vhuAgrementBroyeurNumber: true,
          vhuAgrementBroyeurDepartment: true,
          vhuAgrementDemolisseurNumber: true,
          vhuAgrementDemolisseurDepartment: true
        }
      });
      if (type === "BROYEUR") {
        return {
          id: id!,
          agrementNumber: company.vhuAgrementBroyeurNumber!,
          department: company.vhuAgrementBroyeurDepartment!,
          type
        };
      } else {
        return {
          id: id!,
          agrementNumber: company.vhuAgrementDemolisseurNumber!,
          department: company.vhuAgrementDemolisseurDepartment!,
          type
        };
      }
    } catch (_) {
      throw new VhuAgrementNotFound();
    }
  };

export default updateVhuAgrementResolver;
