import { Form, Prisma, Status } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import buildDeleteForm from "./delete";
import buildUpdateManyForms from "./updateMany";

export type UpdateAppendix1Forms = (params: {
  container: Form;
  grouped: Form[];
}) => Promise<void>;

/**
 * When a appendix1 container form is signed, we update its children accordingly.
 * A appendix1 container should only be signed upon arrival and processing. There is no emitter / transporter signature.
 *
 * The following rules applies:
 * - if the child hasn't been picked up by the transporter, unlink it from the container and delete it
 * - otherwise, the child follows the container lifecycle: (accepted -> processed or refused)
 *
 * Note that an appendix1 container cannt be partially accepted.
 */
export function buildUpdateAppendix1Forms(
  deps: RepositoryFnDeps
): UpdateAppendix1Forms {
  return async ({ container, grouped }) => {
    const { user, prisma } = deps;

    const formsToDelete: string[] = [];
    const formUpdatesByStatus = new Map<Status, string[]>();

    for (const form of grouped) {
      const { id } = form;
      // It the appendix1 item has not been picked up by the transporter, we just delete it
      if (
        [Status.DRAFT, Status.SEALED, Status.SIGNED_BY_PRODUCER].some(
          s => s === form.status
        )
      ) {
        formsToDelete.push(id);
        continue;
      }

      // The appendix1 form is SENT.
      // It can evolve in sync with its container
      if (container.status === Status.RECEIVED) {
        const status = transitionForm(form, {
          type: EventType.MarkAsReceived,
          formUpdateInput: {}
        });
        formUpdatesByStatus.set(status, [
          ...(formUpdatesByStatus.get(status) ?? []),
          id
        ]);
      } else if (
        [Status.ACCEPTED, Status.REFUSED].some(
          status => status === container.status
        )
      ) {
        const status = transitionForm(form, {
          type:
            form.status === Status.RECEIVED
              ? EventType.MarkAsAccepted
              : EventType.MarkAsReceived,
          formUpdateInput: {
            wasteAcceptationStatus: container.wasteAcceptationStatus,
            receivedAt: container.receivedAt,
            receivedBy: container.receivedBy,
            wasteRefusalReason: container.wasteRefusalReason
          }
        });
        formUpdatesByStatus.set(status, [
          ...(formUpdatesByStatus.get(status) ?? []),
          id
        ]);
      } else if (
        [
          Status.PROCESSED,
          Status.NO_TRACEABILITY,
          Status.FOLLOWED_WITH_PNTTD,
          Status.AWAITING_GROUP,
          Status.RESEALED
        ].some(status => status === container.status)
      ) {
        const status = transitionForm(form, {
          type: EventType.MarkAsProcessed,
          formUpdateInput: {
            emitterType: form.emitterType, // So that the machine doesn't mark as AWAITING_GROUP if the container is used in an appendix 2
            noTraceability: container.noTraceability,
            processedAt: container.processedAt,
            processedBy: container.processedBy,
            processingOperationDescription:
              container.processingOperationDescription,
            processingOperationDone: container.processingOperationDone
          }
        });
        formUpdatesByStatus.set(status, [
          ...(formUpdatesByStatus.get(status) ?? []),
          id
        ]);
      } else {
        throw new Error(
          "Update appendix 1 called with an unknown container form status."
        );
      }
    }

    const updateManyForms = buildUpdateManyForms({ prisma, user });
    const promises: Promise<Prisma.BatchPayload | Form>[] = [];

    // Status updates, plus push back infos onto the appendix 1 for the PDF
    for (const [status, ids] of formUpdatesByStatus.entries()) {
      promises.push(
        updateManyForms(ids, {
          status,
          wasteAcceptationStatus: container.wasteAcceptationStatus,
          receivedAt: container.receivedAt,
          receivedBy: container.receivedBy,
          signedAt: container.signedAt
        })
      );
    }

    // Unlink & deletions
    // Note: We cannot updates relations in an updateMany (yet ?)
    const deleteForm = buildDeleteForm({ prisma, user });
    for (const id of formsToDelete) {
      promises.push(deleteForm({ id }));
    }

    await Promise.all(promises);
  };
}
