import { Refinement } from "zod";
import { ParsedZodCompany } from "./schema";
import { CompanyType, WasteVehiclesType } from "@td/prisma";
import { prisma } from "@td/prisma";

export const checkForeignTransporter: Refinement<ParsedZodCompany> = (
  company,
  { addIssue }
) => {
  const companyTypes = company.companyTypes;

  if (
    company.vatNumber?.length &&
    companyTypes.filter(ct => ct !== CompanyType.TRANSPORTER).length > 0
  ) {
    addIssue({
      code: "custom",
      message:
        "Seul un établissement ayant comme unique profil Transporteur peut être identifié par à un numéro de TVA (établissement étranger)"
    });
  }
};

export const checkEcoOrganisme: Refinement<ParsedZodCompany> = async (
  company,
  { addIssue }
) => {
  const companyTypes = company.companyTypes;
  if (companyTypes.includes(CompanyType.ECO_ORGANISME) && company.siret) {
    const ecoOrganismeExists = await prisma.ecoOrganisme.findUnique({
      where: { siret: company.siret }
    });
    if (!ecoOrganismeExists) {
      addIssue({
        code: "custom",
        message:
          "Cette entreprise ne fait pas partie de la liste des éco-organismes reconnus par Trackdéchets. Contactez-nous si vous pensez qu'il s'agit d'une erreur : contact@trackdechets.beta.gouv.fr"
      });
    }

    if (company.ecoOrganismeAgreements.length < 1) {
      addIssue({
        code: "custom",
        message: "L'URL de l'agrément de l'éco-organisme est requis."
      });
    }
  }

  if (
    !companyTypes.includes(CompanyType.ECO_ORGANISME) &&
    company.ecoOrganismeAgreements.length > 0
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de lier des agréments d'éco-organisme : l'entreprise n'est pas un éco-organisme."
    });
  }
};

export const checkSubTypes: Refinement<ParsedZodCompany> = (
  company,
  { addIssue }
) => {
  const {
    companyTypes,
    wasteProcessorTypes,
    collectorTypes,
    wasteVehiclesTypes
  } = company;

  if (
    wasteProcessorTypes?.length > 0 &&
    !companyTypes.includes(CompanyType.WASTEPROCESSOR)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de sélectionner un sous-type d'installation de traitement " +
        "si le profil Installation de traitement n'est pas sélectionné"
    });
  }

  if (
    collectorTypes?.length > 0 &&
    !companyTypes.includes(CompanyType.COLLECTOR)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de sélectionner un sous-type d'installation de tri, transit, regroupement " +
        "si le profil Installation de Tri, transit regroupement de déchets n'est pas sélectionné"
    });
  }

  if (
    wasteVehiclesTypes?.length > 0 &&
    !companyTypes.includes(CompanyType.WASTE_VEHICLES)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de sélectionner un sous-type d'installation de traitement VHU " +
        "si le profil Installation de traitement VHU n'est pas sélectionné"
    });
  }
};

export const checkRecepisses: Refinement<ParsedZodCompany> = (
  company,
  { addIssue }
) => {
  const {
    companyTypes,
    transporterReceiptId,
    brokerReceiptId,
    traderReceiptId,
    vhuAgrementBroyeurId,
    wasteVehiclesTypes,
    vhuAgrementDemolisseurId,
    workerCertificationId
  } = company;

  if (transporterReceiptId && !companyTypes.includes(CompanyType.TRANSPORTER)) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner un récépissé transporteur si le profil transporteur n'est pas sélectionné"
    });
  }

  if (brokerReceiptId && !companyTypes.includes(CompanyType.BROKER)) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner un récépissé courtier si le profil courtier n'est pas sélectionné"
    });
  }

  if (traderReceiptId && !companyTypes.includes(CompanyType.TRADER)) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner un récépissé négociant si le profil négociant n'est pas sélectionné"
    });
  }

  if (workerCertificationId && !companyTypes.includes(CompanyType.WORKER)) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner une certification d'entreprise de travaux amiante" +
        " si le profil entreprise de travaux n'est pas sélectionné"
    });
  }

  if (
    vhuAgrementBroyeurId &&
    !wasteVehiclesTypes.includes(WasteVehiclesType.BROYEUR)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner un agrément broyeur si le profil broyeur VHU n'est pas sélectionné"
    });
  }

  if (
    vhuAgrementDemolisseurId &&
    !wasteVehiclesTypes.includes(WasteVehiclesType.DEMOLISSEUR)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de renseigner un agrément démolissuer si le profil démolisseur VHU n'est pas sélectionné"
    });
  }
};

export const checkWorkerSubsection: Refinement<ParsedZodCompany> = async (
  company,
  { addIssue }
) => {
  const { companyTypes, workerCertificationId } = company;

  if (!companyTypes.includes(CompanyType.WORKER)) {
    return;
  }

  const certification = workerCertificationId
    ? await prisma.workerCertification.findUnique({
        where: { id: workerCertificationId }
      })
    : null;

  if (
    !certification ||
    (!certification.hasSubSectionFour && !certification.hasSubSectionThree)
  ) {
    addIssue({
      code: "custom",
      message:
        "Impossible de sélectionner le type Entreprise de travaux amiante si au moins une sous section n'est pas sélectionnée"
    });
  }
};

export const checkEcoOrganismePartnersIds: Refinement<
  ParsedZodCompany
> = async (company, { addIssue }) => {
  const { ecoOrganismePartnersIds } = company;

  // On vérifie que les éco-organismes déclarés existent bien
  if (ecoOrganismePartnersIds && ecoOrganismePartnersIds.length > 0) {
    const ecoOrganismes = await prisma.ecoOrganisme.findMany({
      where: {
        id: {
          in: ecoOrganismePartnersIds
        }
      },
      select: {
        id: true
      }
    });

    const notFoundIds = ecoOrganismePartnersIds.filter(
      id => !ecoOrganismes.map(e => e.id).includes(id)
    );

    if (notFoundIds.length > 0) {
      addIssue({
        code: "custom",
        message: `Les IDs suivants n'appartiennent pas à un éco-organisme : ${notFoundIds.join(
          ", "
        )}`
      });
    }
  }
};
