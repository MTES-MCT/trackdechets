import { Form, Prisma, Status } from "@prisma/client";
import {
  LogMetadata,
  RepositoryFnDeps
} from "../../../common/repository/types";
import { enqueueUpdatedBsdToIndex } from "../../../queue/producers/elastic";
import { getFormSiretsByRole, SIRETS_BY_ROLE_INCLUDE } from "../../database";
import { formDiff, objectDiff } from "../../workflow/diff";
import { getUserCompanies } from "../../../users/database";
import { FormWithForwardedIn, FormWithTransporters } from "../../types";

export type UpdateFormFn = (
  where: Prisma.FormWhereUniqueInput,
  data: Prisma.FormUpdateInput,
  logMetadata?: LogMetadata
) => Promise<Form & FormWithTransporters & FormWithForwardedIn>;

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

    // update transporters ordering when connecting transporters records
    if (
      data.transporters?.connect &&
      Array.isArray(data.transporters.connect)
    ) {
      await Promise.all(
        data.transporters?.connect.map(({ id: transporterId }, idx) =>
          prisma.bsddTransporter.update({
            where: { id: transporterId },
            data: {
              number: idx + 1
            }
          })
        )
      );
    }

    // If a transporter is deleted, make sure to decrement the number of transporters after him.
    // This code should normally only be called from the `updateForm` mutation when { transporter: null }
    // is passed in the UpdateFrom input.
    if (data.transporters?.delete && updatedForm.transporters?.length) {
      if (Array.isArray(data.transporters.delete)) {
        // this case should never happen, throw a custom error to debug in Sentry if it ever does
        throw new Error(
          "Impossible de supprimer plusieurs transporteurs à la fois sur un bordereau"
        );
      } else {
        const deletedTransporterId = data.transporters.delete.id;
        if (deletedTransporterId) {
          const deletedTransporter = oldForm.transporters.find(
            t => t.id === deletedTransporterId
          )!;
          const transporterIdsToDecrement = updatedForm.transporters
            .filter(t => t.number > deletedTransporter.number)
            .map(t => t.id);
          await prisma.bsddTransporter.updateMany({
            where: { id: { in: transporterIdsToDecrement } },
            data: { number: { decrement: 1 } }
          });
        }
      }
    }

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

    const { updatedAt, ...updateDiff } = objectDiff(oldForm, updatedForm);
    await prisma.event.create({
      data: {
        streamId: updatedForm.id,
        actor: user.id,
        type: "BsddUpdated",
        data: { content: updateDiff } as Prisma.InputJsonObject,
        metadata: { ...logMetadata, authType: user.auth }
      }
    });

    if (oldForm.status !== updatedForm.status) {
      const newStatus = updatedForm.status;
      // calculates diff between initial form and updated form
      const updatedFields = formDiff(oldForm, {
        ...updatedForm,
        forwardedIn: updatedForm.forwardedIn
          ? { ...updatedForm.forwardedIn, transporters: [] }
          : null
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

    let needsReindex = true;
    // APPENDIX1_PRODUCER forms are not indexed if they don't belong to a container
    if (updatedForm.emitterType === "APPENDIX1_PRODUCER") {
      const count = await prisma.formGroupement.count({
        where: { initialFormId: updatedForm.id }
      });
      needsReindex = count > 0;
    }

    if (needsReindex) {
      prisma.addAfterCommitCallback(() =>
        enqueueUpdatedBsdToIndex(updatedForm.readableId)
      );
    }

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
