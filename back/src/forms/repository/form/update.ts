import { Form, Prisma, Status } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { getFormSiretsByRole, SIRETS_BY_ROLE_INCLUDE } from "../../database";
import { formDiff } from "../../workflow/diff";
import { getUserCompanies } from "../../../users/database";

export type UpdateFormFn = (
  where: Prisma.FormWhereUniqueInput,
  data: Prisma.FormUpdateInput,
  logMetadata?: LogMetadata
) => Promise<Form>;

const buildUpdateForm: (deps: RepositoryFnDeps) => UpdateFormFn =
  deps => async (where, data, logMetadata) => {
    const { user, prisma } = deps;

    // retrieves form
    // for diff calculation
    const oldForm = await prisma.form.findUniqueOrThrow({
      where,
      include: {
        transporters: true, // make sure transporters field is not re-computed in `formDiff`
        forwardedIn: {
          include: {
            transporters: true // make sure transporters field is not re-computed in `formDiff`
          }
        }
      }
    });

    const hasPossibleSiretChange = checkIfHasPossibleSiretChange(data);
    const updatedForm = await prisma.form.update({
      where,
      data,
      include: hasPossibleSiretChange
        ? { ...SIRETS_BY_ROLE_INCLUDE, forwardedIn: true, transporters: true }
        : { forwardedIn: true, transporters: true }
    });

    // Calculating the sirets from Prisma.FormUpdateInput and the previously existing ones is hard
    // If a siret change might have occurred, we process it in a second update
    if (hasPossibleSiretChange) {
      const denormalizedSirets = getFormSiretsByRole(updatedForm as any); // Ts doesn't infer correctly because of the boolean

      const canAccessDraftSirets: string[] = [];
      if (updatedForm.status === Status.DRAFT) {
        const ownerCompanies = await getUserCompanies(updatedForm.ownerId);
        const ownerOrgIds = ownerCompanies.map(company => company.orgId);

        const formOrgIds = [
          ...denormalizedSirets.intermediariesSirets,
          ...denormalizedSirets.recipientsSirets,
          ...denormalizedSirets.transportersSirets,
          updatedForm.emitterCompanySiret,
          updatedForm.brokerCompanySiret,
          updatedForm.traderCompanySiret,
          updatedForm.ecoOrganismeSiret
        ].filter(Boolean);
        const ownerOrgIdsInForm = ownerOrgIds.filter(orgId =>
          formOrgIds.includes(orgId)
        );

        canAccessDraftSirets.push(...ownerOrgIdsInForm);
      }
      await prisma.form.update({
        where,
        data: { ...denormalizedSirets, canAccessDraftSirets }
      });
    }

    await prisma.event.create({
      data: {
        streamId: updatedForm.id,
        actor: user.id,
        type: "BsddUpdated",
        data: { content: data } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (oldForm.status !== updatedForm.status) {
      const newStatus = updatedForm.status;
      // calculates diff between initial form and updated form
      const updatedFields = await formDiff(oldForm, {
        ...updatedForm,
        forwardedIn: updatedForm.forwardedIn
      });

      // log status change
      await prisma.statusLog.create({
        data: {
          user: { connect: { id: user.id } },
          form: { connect: { id: updatedForm.id } },
          status: newStatus,
          authType: user.auth,
          loggedAt: new Date(),
          updatedFields
        }
      });

      await prisma.event.create({
        data: {
          streamId: updatedForm.id,
          actor: user.id,
          type: "BsddSigned",
          data: { status: data.status },
          metadata: { authType: user.auth }
        }
      });
    }

    prisma.addAfterCommitCallback(() =>
      enqueueUpdatedBsdToIndex(updatedForm.readableId)
    );

    return updatedForm;
  };

export function checkIfHasPossibleSiretChange(data: Prisma.FormUpdateInput) {
  return Boolean(
    data.recipientCompanySiret ||
      data.intermediaries ||
      data.transporters ||
      data.forwardedIn
  );
}

export default buildUpdateForm;
