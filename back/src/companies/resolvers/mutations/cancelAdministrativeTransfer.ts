import { prisma } from "@td/prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";
import { companyEventTypes } from "../../types";
import { AdministrativeTransferStatus } from "@prisma/client";

export const cancelAdministrativeTransfer: MutationResolvers["cancelAdministrativeTransfer"] =
  async (_, { id }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const administrativeTransfer =
      await prisma.administrativeTransfer.findUniqueOrThrow({
        where: { id }
      });

    if (
      administrativeTransfer.status !== AdministrativeTransferStatus.PENDING
    ) {
      throw new UserInputError(
        "Impossible d'annuler un transfert qui n'est pas en attente d'approbation."
      );
    }

    const fromCompany = await prisma.company.findUniqueOrThrow({
      where: { id: administrativeTransfer.fromId },
      select: { orgId: true }
    });

    await checkUserPermissions(
      user,
      fromCompany.orgId,
      Permission.CompanyCanUpdate,
      NotCompanyAdminErrorMsg(fromCompany.orgId)
    );

    await prisma.$transaction(async transaction => {
      await transaction.event.create({
        data: {
          streamId: administrativeTransfer.fromId,
          actor: user.id,
          type: companyEventTypes.administrativeTransferCancelled,
          data: {},
          metadata: { authType: user.auth }
        }
      });

      await transaction.administrativeTransfer.delete({
        where: {
          id
        }
      });
    });

    return true;
  };
