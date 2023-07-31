import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import { VhuAgrementNotFound } from "../../errors";

/**
 * Delete a VHU agrement
 * @param id
 */
const deleteVhuAgrementResolver: MutationResolvers["deleteVhuAgrement"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const { id, type } = input;
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
                vhuAgrementBroyeurNumber: null,
                vhuAgrementBroyeurDepartment: null
              }
            : {
                vhuAgrementDemolisseurNumber: null,
                vhuAgrementDemolisseurDepartment: null
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

export default deleteVhuAgrementResolver;
