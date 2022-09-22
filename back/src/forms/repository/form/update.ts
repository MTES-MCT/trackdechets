import { Form, Prisma } from "@prisma/client";
import { enqueueBsdToIndex } from "../../../queue/producers/elastic";
import { formDiff } from "../../workflow/diff";
import { LogMetadata, RepositoryFnDeps } from "../types";

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
    const oldForm = await prisma.form.findUnique({
      where,
      include: { forwardedIn: true }
    });

    const updatedForm = await prisma.form.update({
      where,
      data
    });

    // retrieves updated temp storage
    const updatedForwardedIn = await prisma.form
      .findUnique({ where })
      .forwardedIn();

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
        forwardedIn: updatedForwardedIn
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
      enqueueBsdToIndex(updatedForm.readableId)
    );

    return updatedForm;
  };

export default buildUpdateForm;
