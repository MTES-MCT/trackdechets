import { prisma, Status } from "../../generated/prisma-client";
import {
  cleanUpNotDuplicatableFieldsInForm,
  expandFormFromDb
} from "../form-converter";
import { getReadableId } from "../readable-id";
import { MutationDuplicateFormArgs, Form } from "../../generated/graphql/types";

/**
 * Duplicate the content of a form into a new DRAFT form
 * A new readable ID is generated and some fields which
 * are not duplicable are omitted
 * @param formId
 * @param userId
 */
export async function duplicateForm(
  userId: string,
  { id: formId }: MutationDuplicateFormArgs
): Promise<Form> {
  const existingForm = await prisma.form({
    id: formId
  });

  // get segments to duplicate them after cleanup
  // const transportSegments = await prisma.transportSegments({
  //   where: {
  //     form: { id: formId }
  //   }
  // });

  const newForm = await prisma.createForm({
    ...cleanUpNotDuplicatableFieldsInForm(existingForm),
    readableId: await getReadableId(),
    status: "DRAFT",
    owner: { connect: { id: userId } }
  });
  // create statuslog when form is created
  await prisma.createStatusLog({
    form: { connect: { id: newForm.id } },
    user: { connect: { id: userId } },
    status: newForm.status as Status,
    updatedFields: {},
    loggedAt: new Date()
  });
  // currently (non tranporter's) UI dashboard does not show segments, so this code is disabled until UI update.
  // const segmentDuplicates = transportSegments.map(segment =>
  //   prisma.createTransportSegment({
  //     form: { connect: { id: newForm.id } },
  //     ...cleanUpNonDuplicatableSegmentField(segment)
  //   })
  // );

  // await Promise.all(segmentDuplicates);

  return expandFormFromDb(newForm);
}
