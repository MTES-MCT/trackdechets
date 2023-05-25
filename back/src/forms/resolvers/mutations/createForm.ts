import { EmitterType, Form, Prisma, TransportMode } from "@prisma/client";
import { isDangerous } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  CreateFormInput,
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  flattenTransporterInput
} from "../../converter";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import {
  draftFormSchema,
  hasPipeline,
  validateGroupement
} from "../../validation";
import { UserInputError } from "apollo-server-core";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { validateIntermediariesInput } from "../../../common/validation";
import { sirenifyFormInput } from "../../sirenify";
import { checkCanCreate } from "../../permissions";
import { UpdateFormFn } from "../../repository/form/update";

const createFormResolver = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const {
    appendix2Forms,
    grouping,
    temporaryStorageDetail,
    intermediaries,
    transporter2,
    transporter3,
    transporter4,
    transporter5,
    ...formContent
  } = await sirenifyFormInput(createFormInput, user);

  if (appendix2Forms && grouping) {
    throw new UserInputError(
      "Vous pouvez renseigner soit `appendix2Forms` soit `grouping` mais pas les deux"
    );
  }

  if (
    formContent.wasteDetails?.code &&
    isDangerous(formContent.wasteDetails?.code) &&
    formContent.wasteDetails.isDangerous === undefined
  ) {
    formContent.wasteDetails.isDangerous = true;
  }

  // APPENDIX1_PRODUCER is the only type of forms for which you don't necessarely appear during creation.
  // The destination and transporter will be auto completed
  if (formContent?.emitter?.type !== "APPENDIX1_PRODUCER") {
    await checkCanCreate(user, createFormInput);
  }

  const form = flattenFormInput(formContent);
  // Pipeline erases transporter EXCEPT for transporterTransportMode
  if (hasPipeline(form as any)) {
    Object.keys(form)
      .filter(key => key.startsWith("transporter"))
      .forEach(key => {
        form[key] = null;
      });
    form.transporterTransportMode = TransportMode.OTHER;
  }

  const readableId = getReadableId();

  const cleanedForm = await draftFormSchema.validate(form);
  const formCreateInput: Prisma.FormCreateInput = {
    ...cleanedForm,
    readableId,
    owner: { connect: { id: user.id } }
  };

  if (temporaryStorageDetail) {
    if (formContent.recipient?.isTempStorage !== true) {
      // The user is trying to set a temporary storage without
      // recipient.isTempStorage=true, throw error
      throw new MissingTempStorageFlag();
    }
    formCreateInput.forwardedIn = {
      create: {
        owner: { connect: { id: user.id } },
        readableId: `${readableId}-suite`,
        ...flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      }
    };
  } else {
    if (formContent.recipient?.isTempStorage === true) {
      // Recipient is temp storage but no details provided
      // Create empty temporary storage details
      formCreateInput.forwardedIn = {
        create: {
          owner: { connect: { id: user.id } },
          readableId: `${readableId}-suite`
        }
      };
    }
  }

  if (intermediaries) {
    await validateIntermediariesInput(intermediaries);
    formCreateInput.intermediaries = {
      createMany: {
        data: intermediaries.map(i => ({
          name: i.name!, // enforced through validation schema
          siret: i.siret!, // enforced through validation schema
          contact: i.contact!, // enforced through validation schema
          address: i.address,
          vatNumber: i.vatNumber,
          phone: i.phone,
          mail: i.mail
        })),
        skipDuplicates: true
      }
    };
  }

  const isGroupement =
    (grouping && grouping.length > 0) ||
    (appendix2Forms && appendix2Forms.length > 0);
  const formFractions = isGroupement
    ? await validateGroupement(
        formCreateInput,
        grouping && grouping.length > 0
          ? grouping
          : appendix2toFormFractions(appendix2Forms!)
      )
    : null;

  const newForm = await runInTransaction(async transaction => {
    const { create, setAppendix1, setAppendix2, update } = getFormRepository(
      user,
      transaction
    );
    const newForm = await create(formCreateInput);
    if (isGroupement) {
      newForm.emitterType === EmitterType.APPENDIX1
        ? await setAppendix1({
            form: newForm,
            appendix1: formFractions!,
            currentAppendix1Forms: []
          })
        : await setAppendix2({
            form: newForm,
            appendix2: formFractions!,
            currentAppendix2Forms: []
          });
    }

    if (transporter2 || transporter3 || transporter4 || transporter5) {
      await setMultiModalTransporters(
        newForm,
        {
          transporter2,
          transporter3,
          transporter4,
          transporter5
        },
        update
      );
    }

    return newForm;
  });

  return expandFormFromDb(newForm);
};

export default createFormResolver;

/**
 * To keep the compatibility with `transportSegments`, we need to explicitely
 * set the `form` foreign key on the transporter objects. That's why multi modal
 * transporters are not created as part of the create input but thanks to an extra
 * call to prisma.form.update
 */
async function setMultiModalTransporters(
  newForm: Form,
  { transporter2, transporter3, transporter4, transporter5 }: CreateFormInput,
  updateForm: UpdateFormFn
) {
  const formUpdateInput: Prisma.FormUpdateInput = {};

  // TODO : we should throw an error here if there is no transporter N
  // and we try to set transporter N+1

  [transporter2, transporter3, transporter4, transporter5].forEach(
    (transporterN, idx) => {
      const N = idx + 2;
      if (transporterN) {
        formUpdateInput[`transporter${N}`] = {
          create: {
            ...flattenTransporterInput({ transporter: transporterN }),
            form: { connect: { id: newForm.id } },
            segmentNumber: N - 1,
            readyToTakeOver: true
          }
        };
      }
    }
  );

  await updateForm({ id: newForm.id }, formUpdateInput);
}
