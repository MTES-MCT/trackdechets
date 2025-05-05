import {
  CollectorType,
  CompanyType,
  CompanyVerificationMode,
  CompanyVerificationStatus,
  Prisma,
  UserRole,
  WasteProcessorType,
  WasteVehiclesType
} from "@prisma/client";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { randomNumber } from "../../../utils";
import { renderMail, verificationProcessInfo } from "@td/mail";
import { deleteCachedUserRoles } from "../../../common/redis/users";
import {
  isClosedCompany,
  CLOSED_COMPANY_ERROR,
  isProfessional,
  isAnonymousCompany
} from "@td/constants";
import { searchCompany } from "../../search";
import {
  addToGeocodeCompanyQueue,
  addToSetCompanyDepartementQueue
} from "../../../queue/producers/company";
import { UserInputError } from "../../../common/errors";
import { isForeignTransporter } from "../../validation";
import { sendFirstOnboardingEmail } from "./verifyCompany";
import { sendVerificationCodeLetter } from "../../../common/post";
import { isGenericEmail } from "@td/constants";
import { parseCompanyAsync } from "../../validation/index";
import { companyInputToZodCompany } from "../../validation/helpers";
import { toGqlCompanyPrivate } from "../../converters";
import { getDefaultNotifications } from "../../../users/notifications";
import { CompanyToSplit, getCompanySplittedAddress } from "../../companyUtils";
import { AnonymousCompanyError } from "../../sirene/errors";
/**
 * Create a new company and associate it to a user
 * who becomes the first admin of the company
 * @param companyInput
 * @param userId
 */
const createCompanyResolver: MutationResolvers["createCompany"] = async (
  parent,
  { companyInput },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const zodCompany = companyInputToZodCompany(companyInput);

  const {
    companyTypes,
    collectorTypes,
    wasteProcessorTypes,
    wasteVehiclesTypes,
    codeNaf,
    gerepId,
    name,
    givenName,
    address,
    transporterReceiptId,
    traderReceiptId,
    brokerReceiptId,
    vhuAgrementDemolisseurId,
    vhuAgrementBroyeurId,
    workerCertificationId,
    allowBsdasriTakeOverWithoutSignature,
    allowAppendix1SignatureAutomation,
    contact,
    contactEmail,
    contactPhone,
    ecoOrganismeAgreements,
    siret,
    vatNumber,
    orgId
  } = await parseCompanyAsync(zodCompany);

  const existingCompany = await prisma.company.findUnique({
    where: {
      orgId
    }
  });

  if (existingCompany) {
    throw new UserInputError(
      `Cette entreprise existe déjà dans Trackdéchets. Contactez l'administrateur de votre entreprise afin qu'il puisse vous inviter à rejoindre l'organisation`
    );
  }

  // check if orgId exists in public databases or in AnonymousCompany
  const companyInfo = await searchCompany(orgId);

  const { street, city, country, postalCode } = getCompanySplittedAddress(
    companyInfo,
    { address, vatNumber } as CompanyToSplit
  );

  if (isClosedCompany(companyInfo)) {
    throw new UserInputError(CLOSED_COMPANY_ERROR);
  }

  if (isAnonymousCompany(companyInfo) && !companyInfo.isRegistered) {
    throw new AnonymousCompanyError();
  }

  const companyCreateInput: Prisma.CompanyCreateInput = {
    orgId,
    siret,
    vatNumber,
    codeNaf,
    gerepId,
    name: companyInfo?.name ?? name,
    givenName,
    address: companyInfo?.address ?? address,
    street,
    city,
    country,
    postalCode,
    companyTypes: { set: companyTypes as CompanyType[] },
    collectorTypes: collectorTypes
      ? { set: collectorTypes as CollectorType[] }
      : undefined,
    wasteProcessorTypes: wasteProcessorTypes
      ? { set: wasteProcessorTypes as WasteProcessorType[] }
      : undefined,
    wasteVehiclesTypes: wasteVehiclesTypes
      ? { set: wasteVehiclesTypes as WasteVehiclesType[] }
      : undefined,
    securityCode: randomNumber(4),
    verificationCode: randomNumber(5).toString(),
    ecoOrganismeAgreements: {
      set: ecoOrganismeAgreements
    },
    allowBsdasriTakeOverWithoutSignature: Boolean(
      allowBsdasriTakeOverWithoutSignature
    ),
    allowAppendix1SignatureAutomation: Boolean(
      allowAppendix1SignatureAutomation
    ),
    contact,
    contactEmail,
    contactPhone
  };

  if (!!transporterReceiptId) {
    companyCreateInput.transporterReceipt = {
      connect: { id: transporterReceiptId }
    };
  }

  if (!!traderReceiptId) {
    companyCreateInput.traderReceipt = {
      connect: { id: traderReceiptId }
    };
  }

  if (!!brokerReceiptId) {
    companyCreateInput.brokerReceipt = {
      connect: { id: brokerReceiptId }
    };
  }

  if (!!vhuAgrementDemolisseurId) {
    companyCreateInput.vhuAgrementDemolisseur = {
      connect: { id: vhuAgrementDemolisseurId }
    };
  }

  if (!!vhuAgrementBroyeurId) {
    companyCreateInput.vhuAgrementBroyeur = {
      connect: { id: vhuAgrementBroyeurId }
    };
  }

  if (!!workerCertificationId) {
    companyCreateInput.workerCertification = {
      connect: { id: workerCertificationId }
    };
  }

  // Foreign transporter: automatically verify (no action needed)
  if (
    isForeignTransporter({
      companyTypes: companyTypes as CompanyType[],
      vatNumber
    })
  ) {
    companyCreateInput.verificationMode = CompanyVerificationMode.AUTO;
    companyCreateInput.verificationStatus = CompanyVerificationStatus.VERIFIED;
    companyCreateInput.verifiedAt = new Date();
  }

  const notifications = getDefaultNotifications(UserRole.ADMIN);
  const companyAssociation = await prisma.companyAssociation.create({
    data: {
      user: { connect: { id: user.id } },
      company: {
        create: companyCreateInput
      },
      role: UserRole.ADMIN,
      ...notifications
    },
    include: { company: true }
  });
  await deleteCachedUserRoles(user.id);
  let company = companyAssociation.company;

  // fill firstAssociationDate field if null (no need to update it if user was previously already associated)
  await prisma.user.updateMany({
    where: { id: user.id, firstAssociationDate: null },
    data: { firstAssociationDate: new Date() }
  });

  // Company needs to be verified
  if (process.env.VERIFY_COMPANY === "true") {
    if (
      isProfessional(companyTypes) &&
      !isForeignTransporter({
        companyTypes: companyTypes as CompanyType[],
        vatNumber
      })
    ) {
      // Email is too generic. Automatically send a verification letter
      if (isGenericEmail(user.email, company.name)) {
        await sendVerificationCodeLetter(company);
        company = await prisma.company.update({
          where: { orgId: company.orgId },
          data: {
            verificationStatus: CompanyVerificationStatus.LETTER_SENT,
            verificationMode: CompanyVerificationMode.LETTER
          }
        });
      }
      // Verify manually by admin
      else {
        await sendMail(
          renderMail(verificationProcessInfo, {
            to: [{ email: user.email, name: user.name }],
            variables: { company }
          })
        );
      }
    }
  }
  if (company.siret && company.address && companyInfo.codeCommune) {
    // Fill latitude, longitude and departement asynchronously
    addToGeocodeCompanyQueue({
      siret: company.siret,
      address: company.address
    });
    addToSetCompanyDepartementQueue({
      siret: company.siret,
      codeCommune: companyInfo.codeCommune
    });
  }

  // If the company is NOT professional or is foreign transporter, send onboarding email
  // (professional onboarding mail is sent on verify)
  if (
    !isProfessional(companyTypes) ||
    isForeignTransporter({
      companyTypes: companyTypes as CompanyType[],
      vatNumber
    })
  ) {
    await sendFirstOnboardingEmail(companyInput, user);
  }
  return toGqlCompanyPrivate(company);
};

export default createCompanyResolver;
