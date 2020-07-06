import {
  flattenFormInput,
  flattenTemporaryStorageDetailInput,
  expandFormFromDb
} from "../form-converter";
import { getReadableId } from "../readable-id";
import {
  Form as PrismaForm,
  FormUpdateInput,
  FormCreateInput,
  Status,
  prisma,
  EcoOrganisme
} from "../../generated/prisma-client";
import { getUserCompanies } from "../../companies/queries";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import {
  MutationSaveFormArgs,
  FormInput,
  Form
} from "../../generated/graphql/types";

/**
 * Custom exception thrown when trying to set temporaryStorageDetail without
 * recipient.isTempStorage = true
 */
class BadTempStorageInput extends UserInputError {
  constructor() {
    super(
      "Vous ne pouvez pas préciser d'entreposage provisoire" +
        " sans spécifier recipient.isTempStorage = true"
    );
  }
}

export async function saveForm(
  userId: string,
  { formInput }: MutationSaveFormArgs
): Promise<Form> {
  const {
    id,
    appendix2Forms,
    ecoOrganisme,
    temporaryStorageDetail,
    ...formContent
  } = formInput;

  const form = flattenFormInput(formContent);

  // await checkThatUserIsPartOftheForm(userId, { ...form, id });

  if (id) {
    // The mutation is used to update an existing form

    // Check the id is valid or throw an exception
    const existingForm = await prisma.form({ id });
    if (!existingForm) {
      throw new UserInputError(`Aucun BSD avec l'id ${id}`);
    }

    // Construct form update payload
    const formUpdateInput: FormUpdateInput = {
      ...form,
      appendix2Forms: { set: appendix2Forms }
    };

    // Link to registered eco organisme by id
    if (ecoOrganisme) {
      formUpdateInput.ecoOrganisme = { connect: ecoOrganisme };
    }

    if (ecoOrganisme === null) {
      const existingEcoOrganisme = await prisma.forms({
        where: { id, ecoOrganisme: { id_not: null } }
      });
      if (existingEcoOrganisme && existingEcoOrganisme.length > 0) {
        // Disconnect linked eco organisme object
        formUpdateInput.ecoOrganisme = { disconnect: true };
      }
    }

    const isOrWillBeTempStorage =
      (existingForm.recipientIsTempStorage &&
        formContent.recipient?.isTempStorage !== false) ||
      formContent.recipient?.isTempStorage === true;

    const existingTemporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    if (
      existingTemporaryStorageDetail &&
      (!isOrWillBeTempStorage || temporaryStorageDetail === null)
    ) {
      formUpdateInput.temporaryStorageDetail = { disconnect: true };
    }

    if (temporaryStorageDetail) {
      if (!isOrWillBeTempStorage) {
        throw new BadTempStorageInput();
      }

      if (existingTemporaryStorageDetail) {
        formUpdateInput.temporaryStorageDetail = {
          update: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
        };
      } else {
        formUpdateInput.temporaryStorageDetail = {
          create: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
        };
      }
    }

    const updatedForm = await prisma.updateForm({
      where: { id },
      data: formUpdateInput
    });
    return expandFormFromDb(updatedForm);
  } else {
    // The mutation is used to create a brand new form
    const formCreateInput: FormCreateInput = {
      ...form,
      readableId: await getReadableId(),
      owner: { connect: { id: userId } },
      appendix2Forms: { connect: appendix2Forms }
    };

    if (ecoOrganisme) {
      // Connect with eco-organisme
      formCreateInput.ecoOrganisme = {
        connect: ecoOrganisme
      };
    }

    if (temporaryStorageDetail) {
      if (formContent.recipient?.isTempStorage === false) {
        // The user is trying to set a temporary storage without
        // recipient.isTempStorage=true, throw error
        throw new BadTempStorageInput();
      }
      formCreateInput.temporaryStorageDetail = {
        create: flattenTemporaryStorageDetailInput(temporaryStorageDetail)
      };
    } else {
      if (formContent.recipient?.isTempStorage === true) {
        // Recipient is temp storage but no details provided
        // Create empty temporary storage details
        formCreateInput.temporaryStorageDetail = {
          create: {}
        };
      }
    }

    const newForm = await prisma.createForm(formCreateInput);

    // create statuslog when and only when form is created
    await prisma.createStatusLog({
      form: { connect: { id: newForm.id } },
      user: { connect: { id: userId } },
      status: newForm.status as Status,
      updatedFields: {},
      loggedAt: new Date()
    });

    return expandFormFromDb(newForm);
  }
}

const formSiretsGetter = (
  form: Partial<PrismaForm> & { ecoOrganisme?: EcoOrganisme }
) => [
  form.emitterCompanySiret,
  form.traderCompanySiret,
  form.recipientCompanySiret,
  form.transporterCompanySiret,
  form.ecoOrganisme?.siret
];

async function checkUserIsPartOfExistingForm(userId: string, form: PrismaForm) {
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();
  const formSirets = formSiretsGetter({ ...form, ecoOrganisme });
  const userCompanies = await getUserCompanies(userId);
  const userSirets = userCompanies.map(c => c.siret);

  if (!formSirets.some(siret => userSirets.includes(siret))) {
    throw new ForbiddenError(
      "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas."
    );
  }
}

async function checkThatUserIsPartOfNewForm(
  userId,
  formInput: FormCreateInput
) {

  const formSirets = formsSiretsGetter({...formInput, }})
}

// async function checkThatUserIsPartOftheForm(userId: string, form: FormInput) {
//   const isEdition = form.id != null;
//   const ecoOrganisme = form.ecoOrganisme?.id
//     ? await prisma.ecoOrganisme({
//         id: form.ecoOrganisme?.id
//       })
//     : null;

//   const formSirets = formSiretsGetter({ ...form, ecoOrganisme });
//   const hasPartialFormInput = formSirets.some(siret => siret == null);

//   if (isEdition && hasPartialFormInput) {
//     const savedForm = await prisma.form({ id: form.id });
//     const savedEcoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();

//     const savedFormSirets = formSiretsGetter({
//       ...savedForm,
//       ecoOrganisme: savedEcoOrganisme
//     });
//     formSirets.push(...savedFormSirets);
//   }

//   const userCompanies = await getUserCompanies(userId);
//   const userSirets = userCompanies.map(c => c.siret);

//   if (!formSirets.some(siret => userSirets.includes(siret))) {
//     throw new ForbiddenError(
//       "Vous ne pouvez pas créer ou modifier un bordereau sur lequel votre entreprise n'apparait pas."
//     );
//   }
// }
