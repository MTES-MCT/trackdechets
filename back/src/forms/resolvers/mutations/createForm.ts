import { EmitterType, Prisma } from "@prisma/client";
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
import { draftFormSchema, validateGroupement } from "../../validation";
import { UserInputError } from "apollo-server-core";
import { appendix2toFormFractions } from "../../compat";
import { runInTransaction } from "../../../common/repository/helper";
import { sirenifyFormInput } from "../../sirenify";
import { validateIntermediariesInput } from "../../../common/validation";

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

  const formCompanies: FormCompanies = {
    emitterCompanySiret: formContent.emitter?.company?.siret ?? null,
    recipientCompanySiret: formContent.recipient?.company?.siret ?? null,
    transporterCompanySiret: formContent.transporter?.company?.siret ?? null,
    transporterCompanyVatNumber:
      formContent.transporter?.company?.vatNumber ?? null,
    traderCompanySiret: formContent.trader?.company?.siret ?? null,
    brokerCompanySiret: formContent.broker?.company?.siret ?? null,
    ecoOrganismeSiret: formContent.ecoOrganisme?.siret ?? null,
    ...(temporaryStorageDetail?.destination?.company?.siret
      ? {
          forwardedIn: {
            recipientCompanySiret:
              temporaryStorageDetail.destination.company.siret,
            transporterCompanySiret: null,
            transporterCompanyVatNumber: null
          }
        }
      : {}),
    ...(intermediaries?.length
      ? {
          intermediariesVatNumbers: intermediaries
            ?.map(intermediary => intermediary.vatNumber)
            .filter(Boolean),
          intermediariesSirets: intermediaries
            ?.map(intermediary => intermediary.siret)
            .filter(Boolean)
        }
      : {})
  };

  // APPENDIX1_PRODUCER is the only type of forms for which you don't necessarely appear during creation.
  // The destination and transporter will be auto completed
  if (formContent?.emitter?.type !== "APPENDIX1_PRODUCER") {
    await checkIsFormContributor(
      user,
      formCompanies,
      "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
    );
  }

  const form = flattenFormInput(formContent);

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
    const { create, setAppendix1, setAppendix2 } = getFormRepository(
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

    return newForm;
  });

  return expandFormFromDb(newForm);
};

export default createFormResolver;
