import { prisma } from "@td/prisma";
import type { MutationResolvers } from "@td/codegen-back";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { AdministrativeTransferStatus } from "@prisma/client";
import { companyEventTypes } from "../../types";
import { enqueueProcessAdministrativeTransferJob } from "../../../queue/producers/administrativeTransfer";

export const submitAdministrativeTransferApproval: MutationResolvers["submitAdministrativeTransferApproval"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    const administrativeTransfer =
      await prisma.administrativeTransfer.findUniqueOrThrow({
        where: { id: input.id }
      });

    const fromCompany = await prisma.company.findUniqueOrThrow({
      where: { id: administrativeTransfer.fromId },
      select: { orgId: true }
    });

    const toCompany = await prisma.company.findUniqueOrThrow({
      where: { id: administrativeTransfer.toId }
    });

    await checkUserPermissions(
      user,
      toCompany.orgId,
      Permission.CompanyCanUpdate,
      NotCompanyAdminErrorMsg(toCompany.orgId)
    );

    if (input.isApproved) {
      await enqueueProcessAdministrativeTransferJob({
        fromOrgId: fromCompany.orgId,
        toOrgId: toCompany.orgId
      });
    }

    const status = input.isApproved
      ? AdministrativeTransferStatus.ACCEPTED
      : AdministrativeTransferStatus.REFUSED;

    const administrtiveTransfer = await prisma.$transaction(
      async transaction => {
        await transaction.event.create({
          data: {
            streamId: administrativeTransfer.fromId,
            actor: user.id,
            type: companyEventTypes.administrativeTransferApproval,
            data: { status },
            metadata: { authType: user.auth }
          }
        });

        return transaction.administrativeTransfer.update({
          where: { id: administrativeTransfer.id },
          data: {
            approvedAt: new Date(),
            status
          }
        });
      }
    );

    return administrtiveTransfer as any;
  };
