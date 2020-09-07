import { prisma, Status } from "../../../generated/prisma-client";
import {
  cleanUpNotDuplicatableFieldsInForm,
  expandFormFromDb
} from "../../form-converter";
import { getReadableId } from "../../readable-id";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound, getFullForm } from "../../database";
import { getFullUser } from "../../../users/database";
import { isFormContributor } from "../../permissions";
import { NotFormContributor } from "../../errors";

/**
 * Duplicate the content of a form into a new DRAFT form
 * A new readable ID is generated and some fields which
 * are not duplicable are omitted
 * @param formId
 * @param userId
 */
const duplicateFormResolver: MutationResolvers["duplicateForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingForm = await getFormOrFormNotFound({ id });

  const fullUser = await getFullUser(user);
  const fullExistingForm = await getFullForm(existingForm);

  if (!isFormContributor(fullUser, fullExistingForm)) {
    throw new NotFormContributor();
  }

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
    owner: { connect: { id: user.id } }
  });
  // create statuslog when form is created
  await prisma.createStatusLog({
    form: { connect: { id: newForm.id } },
    user: { connect: { id: user.id } },
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
};

export default duplicateFormResolver;
