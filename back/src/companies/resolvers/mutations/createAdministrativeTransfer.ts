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
      !fromCompany.companyTypes.every(type =>
        toCompany.companyTypes.includes(type)
      )
    ) {
      throw new UserInputError(
        "L'établissement d'arrivée n'a pas les mêmes profils que l'établissement de départ. Impossible de réaliser le transfert."
      );
    }

    const data = {
      fromId: fromCompany.id,
      toId: toCompany.id
    };

    await prisma.event.create({
      data: {
        streamId: fromCompany.orgId,
        actor: user.id,
        type: companyEventTypes.administrativeTransferCreated,
        data,
        metadata: { authType: user.auth }
      }
    });

    return prisma.administrativeTransfer.create({
      data
    }) as any;
  };
