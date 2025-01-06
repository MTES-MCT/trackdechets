import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";
import { companyEventTypes } from "../../types";
import { AdministrativeTransferStatus } from "@prisma/client";

export const createAdministrativeTransfer: MutationResolvers["createAdministrativeTransfer"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    await checkUserPermissions(
      user,
      input.from,
      Permission.CompanyCanUpdate,
      NotCompanyAdminErrorMsg(input.from)
    );

    const fromCompany = await prisma.company.findUniqueOrThrow({
      where: { orgId: input.from },
      include: { givenAdministrativeTransfers: true }
    });

    if (!fromCompany.isDormantSince) {
      throw new UserInputError(
        "L'entreprise de départ n'est pas en sommeil. Impossible de réaliser un transfert administratif."
      );
    }

    if (
      fromCompany.givenAdministrativeTransfers.some(
        t => t.status === AdministrativeTransferStatus.PENDING
      )
    ) {
      throw new UserInputError(
        "L'entreprise de départ a déjà un transfert administratif en cours."
      );
    }

    if (input.from === input.to) {
      throw new UserInputError(
        "L'entreprise de départ est identique à celle d'arrivée."
      );
    }

    const toCompany = await prisma.company.findUniqueOrThrow({
      where: { orgId: input.to }
    });

    if (
      !toCompany.companyTypes.includes("COLLECTOR") ||
      !fromCompany.collectorTypes.every(type =>
        toCompany.collectorTypes.includes(type)
      )
    ) {
      throw new UserInputError(
        "L'établissement d'arrivée n'a pas les mêmes sous-profils d'installation de tri, transit regroupement que l'établissement de départ. Impossible de réaliser le transfert."
      );
    }

    const data = {
      fromId: fromCompany.id,
      toId: toCompany.id
    };

    const administrativeTransfer = await prisma.$transaction(
      async transaction => {
        await transaction.event.create({
          data: {
            streamId: fromCompany.orgId,
            actor: user.id,
            type: companyEventTypes.administrativeTransferCreated,
            data,
            metadata: { authType: user.auth }
          }
        });

        return transaction.administrativeTransfer.create({
          data
        });
      }
    );

    return administrativeTransfer as any;
  };
