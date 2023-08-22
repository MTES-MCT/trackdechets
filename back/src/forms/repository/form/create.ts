import { Form, Prisma, Status } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueCreatedBsdToIndex } from "../../../queue/producers/elastic";
import { getFormSiretsByRole, SIRETS_BY_ROLE_INCLUDE } from "../../database";
import { getUserCompanies } from "../../../users/database";

export type CreateFormFn = (
  data: Prisma.FormCreateInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildCreateForm: (deps: RepositoryFnDeps) => CreateFormFn =
  deps => async (data, logMetadata?) => {
    const { prisma, user } = deps;

    const form = await prisma.form.create({
      data,
      include: {
        ...SIRETS_BY_ROLE_INCLUDE,
        forwardedIn: true,
        transporters: true
      }
    });

    // Deducting every sirets from a Prisma.FormCreateInput object is far from trivial
    // It's safer to fill the denormalized sirets after the creation
    const denormalizedSirets = getFormSiretsByRole(form as any); // Ts doesn't infer correctly because of the boolean

    // For drafts, only the owner's sirets that appear on the form have access
    const canAccessDraftSirets: string[] = [];
    if (form.status === Status.DRAFT) {
      const ownerCompanies = await getUserCompanies(form.ownerId);
      const ownerOrgIds = ownerCompanies.map(company => company.orgId);

      const formOrgIds = [
        ...denormalizedSirets.intermediariesSirets,
        ...denormalizedSirets.recipientsSirets,
        ...denormalizedSirets.transportersSirets,
        form.emitterCompanySiret,
        form.brokerCompanySiret,
        form.traderCompanySiret,
        form.ecoOrganismeSiret
      ].filter(Boolean);
      const ownerOrgIdsInForm = ownerOrgIds.filter(orgId =>
        formOrgIds.includes(orgId)
      );
      canAccessDraftSirets.push(...ownerOrgIdsInForm);
    }

    await prisma.form.update({
      where: { id: form.id },
      data: { ...denormalizedSirets, canAccessDraftSirets }
    });

    // update transporters ordering when connecting transporters records
    if (
      data.transporters?.connect &&
      Array.isArray(data.transporters.connect)
    ) {
      await Promise.all(
        data.transporters.connect.map(({ id: transporterId }, idx) =>
          prisma.bsddTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    await prisma.statusLog.create({
      data: {
        form: { connect: { id: form.id } },
        user: { connect: { id: user.id } },
        status: form.status,
        updatedFields: {},
        authType: user.auth,
        loggedAt: form.createdAt
      }
    });

    await prisma.event.create({
      data: {
        streamId: form.id,
        actor: user.id,
        type: "BsddCreated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    prisma.addAfterCommitCallback(() =>
      enqueueCreatedBsdToIndex(form.readableId)
    );

    return form;
  };

export default buildCreateForm;
