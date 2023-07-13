import { Form, Prisma, Status, User } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getFirstTransporter, getFormOrFormNotFound } from "../../database";
import { expandFormFromDb } from "../../converter";
import { checkCanDuplicate } from "../../permissions";
import getReadableId from "../../readableId";
import { getFormRepository } from "../../repository";
import { FullForm } from "../../types";
import { prismaJsonNoNull } from "../../../common/converter";
import prisma from "../../../prisma";

/**
 * Retrieves companies present on the form that a registered in TD
 */
async function getFormCompanies(form: Form) {
  const firstTransporter = await getFirstTransporter(form);

  const companiesOrgIds = [
    form.emitterCompanySiret,
    form.recipientCompanySiret,
    form.brokerCompanySiret,
    form.traderCompanySiret,
    firstTransporter?.transporterCompanySiret,
    firstTransporter?.transporterCompanyVatNumber
  ].filter(Boolean);

  // Batch fetch all companies involved in the form
  const companies = await prisma.company.findMany({
    where: { orgId: { in: companiesOrgIds } },
    include: {
      transporterReceipt: true,
      traderReceipt: true,
      brokerReceipt: true
    }
  });

  const emitter = companies.find(
    company => company.orgId === form.emitterCompanySiret
  );

  const recipient = companies.find(
    company => company.orgId === form.recipientCompanySiret
  );

  const broker = companies.find(
    company => company.orgId === form.brokerCompanySiret
  );
  const transporter = companies.find(
    company =>
      company.orgId === firstTransporter?.transporterCompanySiret ||
      company.orgId === firstTransporter?.transporterCompanyVatNumber
  );
  const trader = companies.find(
    company => company.orgId === form.traderCompanySiret
  );

  return {
    emitter,
    recipient,
    transporter,
    broker,
    trader,
    form: { ...form, transporter: firstTransporter }
  };
}

/**
 * Get duplicable form fields
 *
 * @param {User} user user that should own the duplicated form
 * @param {Form} form the form to duplicate
 */
async function getDuplicateFormInput(
  user: User,
  form: Form
): Promise<Prisma.FormCreateInput> {
  const {
    emitter,
    transporter,
    recipient,
    broker,
    trader,
    form: fullForm
  } = await getFormCompanies(form);

  return {
    readableId: getReadableId(),
    status: Status.DRAFT,
    owner: { connect: { id: user.id } },
    emitterType: form.emitterType,
    emitterPickupSite: form.emitterPickupSite,
    emitterIsPrivateIndividual: form.emitterIsPrivateIndividual,
    emitterIsForeignShip: form.emitterIsForeignShip,
    emitterCompanyName: emitter?.name ?? form.emitterCompanyName,
    emitterCompanySiret: form.emitterCompanySiret,
    emitterCompanyAddress: emitter?.address ?? form.emitterCompanyAddress,
    emitterCompanyContact: emitter?.contact ?? form.emitterCompanyContact,
    emitterCompanyPhone: emitter?.contactPhone ?? form.emitterCompanyPhone,
    emitterCompanyMail: emitter?.contactEmail ?? form.emitterCompanyMail,
    emitterCompanyOmiNumber: form.emitterCompanyOmiNumber,
    emitterWorkSiteName: form.emitterWorkSiteName,
    emitterWorkSiteAddress: form.emitterWorkSiteAddress,
    emitterWorkSiteCity: form.emitterWorkSiteCity,
    emitterWorkSitePostalCode: form.emitterWorkSitePostalCode,
    emitterWorkSiteInfos: form.emitterWorkSiteInfos,
    recipientCap: form.recipientCap,
    recipientProcessingOperation: form.recipientProcessingOperation,
    recipientCompanyName: recipient?.name ?? form.recipientCompanyName,
    recipientCompanySiret: form.recipientCompanySiret,
    recipientCompanyAddress: recipient?.address ?? form.recipientCompanyAddress,
    recipientCompanyContact: recipient?.contact ?? form.recipientCompanyContact,
    recipientCompanyPhone:
      recipient?.contactPhone ?? form.recipientCompanyPhone,
    recipientCompanyMail: recipient?.contactEmail ?? form.recipientCompanyMail,
    recipientIsTempStorage: form.recipientIsTempStorage,
    wasteDetailsCode: form.wasteDetailsCode,
    wasteDetailsOnuCode: form.wasteDetailsOnuCode,
    wasteDetailsPackagingInfos: Prisma.JsonNull,
    wasteDetailsQuantity: 0,
    wasteDetailsQuantityType: form.wasteDetailsQuantityType,
    wasteDetailsPop: form.wasteDetailsPop,
    wasteDetailsIsDangerous: form.wasteDetailsIsDangerous,
    wasteDetailsParcelNumbers: prismaJsonNoNull(form.wasteDetailsParcelNumbers),
    wasteDetailsAnalysisReferences: form.wasteDetailsAnalysisReferences,
    wasteDetailsLandIdentifiers: form.wasteDetailsLandIdentifiers,
    wasteDetailsName: form.wasteDetailsName,
    wasteDetailsConsistence: form.wasteDetailsConsistence,
    wasteDetailsSampleNumber: form.wasteDetailsSampleNumber,
    traderCompanyName: trader?.name ?? form.traderCompanyName,
    traderCompanySiret: form.traderCompanySiret,
    traderCompanyAddress: trader?.address ?? form.traderCompanyAddress,
    traderCompanyContact: trader?.contact ?? form.traderCompanyContact,
    traderCompanyPhone: trader?.contactPhone ?? form.traderCompanyPhone,
    traderCompanyMail: trader?.contactEmail ?? form.traderCompanyMail,
    traderReceipt: trader?.traderReceipt?.receiptNumber ?? form.traderReceipt,
    traderDepartment:
      trader?.traderReceipt?.department ?? form.traderDepartment,
    traderValidityLimit:
      trader?.traderReceipt?.validityLimit ?? form.traderValidityLimit,
    brokerCompanyName: broker?.name ?? form.brokerCompanyName,
    brokerCompanySiret: form.brokerCompanySiret,
    brokerCompanyAddress: broker?.address ?? form.brokerCompanyAddress,
    brokerCompanyContact: broker?.contact ?? form.brokerCompanyContact,
    brokerCompanyPhone: broker?.contactPhone ?? form.brokerCompanyPhone,
    brokerCompanyMail: broker?.contactEmail ?? form.brokerCompanyMail,
    brokerReceipt: broker?.brokerReceipt?.receiptNumber ?? form.brokerReceipt,
    brokerDepartment:
      broker?.brokerReceipt?.department ?? form.brokerDepartment,
    brokerValidityLimit:
      broker?.brokerReceipt?.validityLimit ?? form.brokerValidityLimit,
    ecoOrganismeName: form.ecoOrganismeName,
    ecoOrganismeSiret: form.ecoOrganismeSiret,
    transporters: {
      create: {
        transporterCompanyName:
          transporter?.name ?? fullForm.transporter?.transporterCompanyName,
        transporterCompanySiret: fullForm.transporter?.transporterCompanySiret,
        transporterCompanyAddress:
          transporter?.address ??
          fullForm.transporter?.transporterCompanyAddress,
        transporterCompanyContact:
          transporter?.contact ??
          fullForm.transporter?.transporterCompanyContact,
        transporterCompanyPhone:
          transporter?.contactPhone ??
          fullForm.transporter?.transporterCompanyPhone,
        transporterCompanyMail:
          transporter?.contactEmail ??
          fullForm.transporter?.transporterCompanyMail,
        transporterCompanyVatNumber:
          fullForm.transporter?.transporterCompanyVatNumber,
        transporterReceipt:
          transporter?.transporterReceipt?.receiptNumber ?? null,
        transporterDepartment:
          transporter?.transporterReceipt?.department ?? null,
        transporterValidityLimit:
          transporter?.transporterReceipt?.validityLimit ?? null,
        transporterTransportMode:
          fullForm.transporter?.transporterTransportMode,
        transporterIsExemptedOfReceipt:
          fullForm.transporter?.transporterIsExemptedOfReceipt,
        number: 1
      }
    }
  };
}

/**
 * Get duplicable form fields on BSD suite
 */
async function getDuplicateFormForwardedInInput(
  user: User,
  form: FullForm
): Promise<Omit<Prisma.FormCreateInput, "readableId">> {
  const forwardedIn = form.forwardedIn;

  if (!forwardedIn) {
    throw new Error(
      `Duplication - We expected a forwardedIn for form ${form.id}`
    );
  }

  const { emitter, recipient } = await getFormCompanies(forwardedIn);

  return {
    status: Status.DRAFT,
    owner: { connect: { id: user.id } },
    emitterType: forwardedIn.emitterType,
    emitterCompanyName: emitter?.name ?? forwardedIn.emitterCompanyName,
    emitterCompanySiret: forwardedIn.emitterCompanySiret,
    emitterCompanyAddress:
      emitter?.address ?? forwardedIn.emitterCompanyAddress,
    emitterCompanyContact:
      emitter?.contact ?? forwardedIn.emitterCompanyContact,
    emitterCompanyPhone:
      emitter?.contactPhone ?? forwardedIn.emitterCompanyPhone,
    emitterCompanyMail: emitter?.contactEmail ?? forwardedIn.emitterCompanyMail,
    recipientCap: forwardedIn.recipientCap,
    recipientProcessingOperation: forwardedIn.recipientProcessingOperation,
    recipientCompanyName: recipient?.name ?? forwardedIn.recipientCompanyName,
    recipientCompanySiret: forwardedIn.recipientCompanySiret,
    recipientCompanyAddress:
      recipient?.address ?? forwardedIn.recipientCompanyAddress,
    recipientCompanyContact:
      recipient?.contact ?? forwardedIn.recipientCompanyContact,
    recipientCompanyPhone:
      recipient?.contactPhone ?? forwardedIn.recipientCompanyPhone,
    recipientCompanyMail:
      recipient?.contactEmail ?? forwardedIn.recipientCompanyMail,
    wasteDetailsCode: forwardedIn.wasteDetailsCode,
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      form.wasteDetailsPackagingInfos
    ),
    wasteDetailsOnuCode: forwardedIn.wasteDetailsOnuCode,
    wasteDetailsPop: forwardedIn.wasteDetailsPop,
    wasteDetailsIsDangerous: forwardedIn.wasteDetailsIsDangerous,
    wasteDetailsName: forwardedIn.wasteDetailsName,
    wasteDetailsConsistence: forwardedIn.wasteDetailsConsistence
  };
}

/**
 * Duplicate the content of a form into a new DRAFT form
 * A new readable ID is generated and some fields which
 * are not duplicable are omitted
 */
const duplicateFormResolver: MutationResolvers["duplicateForm"] = async (
  parent,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingForm = await getFormOrFormNotFound({ id });

  await checkCanDuplicate(user, existingForm);

  const formRepository = getFormRepository(user);

  const newFormInput = await getDuplicateFormInput(user, existingForm);

  const fullForm = await formRepository.findFullFormById(existingForm.id);
  if (fullForm?.forwardedIn) {
    const forwardedFormInput = await getDuplicateFormForwardedInInput(
      user,
      fullForm
    );
    newFormInput.forwardedIn = {
      create: {
        ...forwardedFormInput,
        readableId: `${newFormInput.readableId}-suite`
      }
    };
  }

  if (fullForm?.intermediaries) {
    newFormInput.intermediaries = {
      createMany: {
        data: fullForm.intermediaries.map(int => ({
          siret: int.siret,
          address: int.address,
          vatNumber: int.vatNumber,
          name: int.name,
          contact: int.contact,
          phone: int.phone,
          mail: int.mail
        })),
        skipDuplicates: true
      }
    };
  }

  const newForm = await formRepository.create(newFormInput, {
    duplicate: { id: existingForm.id }
  });

  return expandFormFromDb(newForm);
};

export default duplicateFormResolver;
