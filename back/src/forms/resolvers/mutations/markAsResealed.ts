import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFormOrFormNotFound } from "../../database";
import {
  expandFormFromDb,
  flattenResealedFormInput
} from "../../form-converter";
import { checkCanMarkAsResealed } from "../../permissions";
import { checkCompaniesType, resealedFormSchema } from "../../validation";
import transitionForm from "../../workflow/transitionForm";
import { EventType } from "../../workflow/types";
import { Form, Status } from "@prisma/client";
import { getFormRepository } from "../../repository";

const markAsResealed: MutationResolvers["markAsResealed"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const { id, resealedInfos } = args;

  const form = await getFormOrFormNotFound({ id });
  const formRepository = getFormRepository(user);

  const { temporaryStorageDetail } = await formRepository.findFullFormById(
    form.id
  );

  if (temporaryStorageDetail === null) {
    throw new UserInputError(
      "Ce bordereau ne correspond pas à un entreposage provisoire ou un reconditionnemnt"
    );
  }

  await checkCanMarkAsResealed(user, form);

  const updateInput = flattenResealedFormInput(resealedInfos);

  if (
    updateInput.destinationIsFilledByEmitter === undefined &&
    temporaryStorageDetail.destinationIsFilledByEmitter &&
    updateInput.destinationCompanySiret !==
      temporaryStorageDetail.destinationCompanySiret
  ) {
    updateInput.destinationIsFilledByEmitter = false;
  }

  // validate input
  await resealedFormSchema.validate({
    ...temporaryStorageDetail,
    ...updateInput
  });

  await checkCompaniesType(form);

  const formUpdateInput = {
    temporaryStorageDetail: {
      update: updateInput
    }
  };

  let resealedForm: Form | null = null;

  if (form.status === Status.RESEALED) {
    // by pass xstate transition because markAsResealed is
    // used to update an already resealed form
    resealedForm = await formRepository.update(
      { id },
      { temporaryStorageDetail: { update: updateInput } }
    );
  } else {
    resealedForm = await transitionForm(user, form, {
      type: EventType.MarkAsResealed,
      formUpdateInput
    });
  }

  return expandFormFromDb(resealedForm);
};

export default markAsResealed;
