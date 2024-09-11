import { prisma } from "@td/prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkUserPermissions, Permission } from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { AdministrativeTransferStatus } from "@prisma/client";
import { companyEventTypes } from "../../types";

export const submitAdministrativeTransferApproval: MutationResolvers["submitAdministrativeTransferApproval"] =
  async (parent, { input }, context) => {
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
      where: { id: administrativeTransfer.toId },
      select: { orgId: true }
    });

    await checkUserPermissions(
      user,
      toCompany.orgId,
      Permission.CompanyCanRenewSecurityCode,
      NotCompanyAdminErrorMsg(toCompany.orgId)
    );

    const destinationInfos = await prisma.company.findUniqueOrThrow({
      where: { orgId: toCompany.orgId }
    });

    if (input.isApproved) {
      const bsddsToTransfer = await prisma.form.findMany({
        where: {
          recipientCompanySiret: fromCompany.orgId,
          status: {
            in: ["AWAITING_GROUP"]
          }
        },
        select: { id: true }
      });

      await prisma.form.updateMany({
        where: { id: { in: bsddsToTransfer.map(bsdd => bsdd.id) } },
        data: {
          recipientCompanySiret: toCompany.orgId,
          recipientCompanyName: destinationInfos.name,
          recipientCompanyAddress: destinationInfos.address,
          recipientCompanyContact: destinationInfos.contact,
          recipientCompanyMail: destinationInfos.contactEmail,
          recipientCompanyPhone: destinationInfos.contactPhone
        }
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
