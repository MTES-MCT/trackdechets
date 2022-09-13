import { CompanyType, Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { convertUrls } from "../../database";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { randomNumber } from "../../../utils";
import * as COMPANY_TYPES from "../../../common/constants/COMPANY_TYPES";
import { renderMail } from "../../../mailer/templates/renderers";
import { verificationProcessInfo } from "../../../mailer/templates";
import { deleteCachedUserCompanies } from "../../../common/redis/users";
import { isFRVat, isSiret, isVat } from "../../../common/constants/companySearchHelpers";
import { whereSiretOrVatNumber } from "../CompanySearchResult";
import { searchCompany } from "../../search";
import {
  addToGeocodeCompanyQueue,
  addToSetCompanyDepartementQueue
} from "../../../queue/producers/company";

/**
 * Create a new company and associate it to a user
 * who becomes the first admin of the company
 * @param companyInput
 * @param userId
 */

const { VERIFY_COMPANY } = process.env;

const createCompanyResolver: MutationResolvers["createCompany"] = async (
  parent,
  { companyInput },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const {
    codeNaf,
    gerepId,
    companyName: name,
    givenName,
    address,
    companyTypes,
    transporterReceiptId,
    traderReceiptId,
    brokerReceiptId,
    vhuAgrementDemolisseurId,
    vhuAgrementBroyeurId,
    allowBsdasriTakeOverWithoutSignature
  } = companyInput;

  const ecoOrganismeAgreements =
    companyInput.ecoOrganismeAgreements?.map(a => a.href) || [];

  // clean orgId
  const orgId = companyInput.orgId.replace(/\s+|\.+/g, "");
  // copy VAT number to the SIRET field in order to ensure backward compatibility
  const siret = orgId;
  let vatNumber: string;
  if (isFRVat(orgId)) {
    throw new UserInputError(
      "Impossible de créer un établissement identifié par un numéro de TVA français, merci d'indique un SIRET"
    );
  }
  if (isVat(orgId)) {
    vatNumber = orgId;
    if (companyTypes.join("") !== CompanyType.TRANSPORTER) {
      throw new UserInputError(
        "Impossible de créer un établissement identifié par un numéro de TVA d'un autre type que TRANSPORTER"
      );
    }
  } else if (!isSiret(orgId)) {
    throw new UserInputError(
      "Impossible de créer un établissement sans un SIRET valide ni un numéro de TVA étranger valide"
    );
  }
  const existingCompany = await prisma.company.findUnique({
    where: whereSiretOrVatNumber({ siret, vatNumber })
  });

  if (existingCompany) {
    throw new UserInputError(
      `Cette entreprise existe déjà dans Trackdéchets. Contactez l'administrateur de votre entreprise afin qu'il puisse vous inviter à rejoindre l'organisation`
    );
  }

  // check if orgId exists in public databases or in AnonymousCompany
  const companyInfo = await searchCompany(orgId);

  if (companyTypes.includes("ECO_ORGANISME") && siret) {
    const ecoOrganismeExists = await prisma.ecoOrganisme.findUnique({
      where: { siret }
    });
    if (!ecoOrganismeExists) {
      throw new UserInputError(
        "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. Contactez-nous si vous pensez qu'il s'agit d'une erreur : contact@trackdechets.beta.gouv.fr"
      );
    }

    if (ecoOrganismeAgreements.length < 1) {
      throw new UserInputError(
        "L'URL de l'agrément de l'éco-organisme est requis."
      );
    }
  } else if (ecoOrganismeAgreements.length > 0) {
    throw new UserInputError(
      "Impossible de lier des agréments d'éco-organisme : l'entreprise n'est pas un éco-organisme."
    );
  }

  const companyCreateInput: Prisma.CompanyCreateInput = {
    siret,
    vatNumber,
    codeNaf,
    gerepId,
    name,
    givenName,
    address,
    companyTypes: { set: companyTypes },
    securityCode: randomNumber(4),
    verificationCode: randomNumber(5).toString(),
    ecoOrganismeAgreements: {
      set: ecoOrganismeAgreements
    },
    allowBsdasriTakeOverWithoutSignature
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

  const companyAssociation = await prisma.companyAssociation.create({
    data: {
      user: { connect: { id: user.id } },
      company: {
        create: companyCreateInput
      },
      role: "ADMIN"
    },
    include: { company: true }
  });
  await deleteCachedUserCompanies(user.id);
  const company = companyAssociation.company;

  // fill firstAssociationDate field if null (no need to update it if user was previously already associated)
  await prisma.user.updateMany({
    where: { id: user.id, firstAssociationDate: null },
    data: { firstAssociationDate: new Date() }
  });

  if (VERIFY_COMPANY === "true") {
    const isProfessional = company.companyTypes.some(ct => {
      return COMPANY_TYPES.PROFESSIONALS.includes(ct);
    });
    if (isProfessional) {
      await sendMail(
        renderMail(verificationProcessInfo, {
          to: [{ email: user.email, name: user.name }],
          variables: { company }
        })
      );
    }
  }

  // Fill latitude, longitude and departement asynchronously
  addToGeocodeCompanyQueue({ siret: company.siret, address: company.address });
  addToSetCompanyDepartementQueue({
    siret: company.siret,
    codeCommune: companyInfo.codeCommune
  });

  return convertUrls(company);
};

export default createCompanyResolver;
