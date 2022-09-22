import { Prisma } from "@prisma/client";
import { isDangerous } from "../../../common/constants";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  MutationCreateFormArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { MissingTempStorageFlag } from "../../errors";
import {
  expandFormFromDb,
  flattenFormInput,
  flattenTemporaryStorageDetailInput
} from "../../converter";
import { checkIsFormContributor } from "../../permissions";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import { FormCompanies } from "../../types";
import { draftFormSchema, validateIntermediariesInput } from "../../validation";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import { preCheckAppendix2 } from "../../repository/form/setAppendix2";

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
    ...formContent
  } = createFormInput;

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

  const formCompanies: FormCompanies = {
    emitterCompanySiret: formContent.emitter?.company?.siret,
    recipientCompanySiret: formContent.recipient?.company?.siret,
    transporterCompanySiret: formContent.transporter?.company?.siret,
    traderCompanySiret: formContent.trader?.company?.siret,
    brokerCompanySiret: formContent.broker?.company?.siret,
    ecoOrganismeSiret: formContent.ecoOrganisme?.siret,
    ...(temporaryStorageDetail?.destination?.company?.siret
      ? {
          forwardedIn: {
            recipientCompanySiret:
              temporaryStorageDetail.destination.company.siret,
            transporterCompanySiret: null
          }
        }
      : {}),
    ...(intermediaries?.length
      ? {
          intermediariesVatNumbers: intermediaries?.map(
            intermediary => intermediary.vatNumber ?? null
          ),
          intermediariesSirets: intermediaries?.map(
            intermediary => intermediary.siret ?? null
          )
        }
      : {})
  };

  await checkIsFormContributor(
    user,
    formCompanies,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const form = flattenFormInput(formContent);

  const readableId = getReadableId();

  const formCreateInput: Prisma.FormCreateInput = {
    ...form,
    readableId,
    owner: { connect: { id: user.id } }
  };

  await draftFormSchema.validate(formCreateInput);

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
    formCreateInput.intermediaries = {
      createMany: {
        data: await validateIntermediariesInput(intermediaries),
        skipDuplicates: true
      }
    };
  }

  // currentAppendix2Forms will be empty
  const { appendix2, currentAppendix2Forms } = await preCheckAppendix2(
    form,
    grouping,
    appendix2Forms
  );

  const newForm = await prisma.$transaction(async transaction => {
    const { create, setAppendix2, updateAppendix2Forms } = getFormRepository(
      user,
      transaction
    );
    const newForm = await create(formCreateInput);
    await setAppendix2({
      form: newForm,
      appendix2,
      currentAppendix2Forms,
      updateAppendix2Forms
    });
    return newForm;
  });

  return expandFormFromDb(newForm);
};

export default createFormResolver;
