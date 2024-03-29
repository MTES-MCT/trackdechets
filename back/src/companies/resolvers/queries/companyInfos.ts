import { UserInputError } from "../../../common/errors";
import {
  CompanyPublic,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getInstallation } from "../../database";
import { searchCompany } from "../../search";

/**
 * Recherche et renvoie les données diffusables
 * sur une entreprise pour un numéro de SIRET ou de TVA
 * Fusionnant les infos des bases Trackdéchets et S3IC
 * si elles existent
 * @param siretOrVat
 */
export async function getCompanyInfos(
  siretOrVat: string
): Promise<CompanyPublic> {
  if (!siretOrVat) {
    throw new UserInputError(
      "Paramètre absent. Un numéro SIRET ou de TVA intracommunautaire valide est requis",
      {
        invalidArgs: ["clue"]
      }
    );
  }
  const searchResult = await searchCompany(siretOrVat);

  return {
    orgId: searchResult.orgId,
    siret: searchResult.siret,
    vatNumber: searchResult.vatNumber,
    codePaysEtrangerEtablissement: searchResult.codePaysEtrangerEtablissement,
    etatAdministratif: searchResult.etatAdministratif,
    statutDiffusionEtablissement: searchResult.statutDiffusionEtablissement,
    address: searchResult.address,
    codeCommune: searchResult.codeCommune,
    name: searchResult.name,
    naf: searchResult.naf,
    libelleNaf: searchResult.libelleNaf,
    installation: await getInstallation(siretOrVat),
    contact: searchResult.contact,
    contactEmail: searchResult.contactEmail,
    contactPhone: searchResult.contactPhone,
    website: searchResult.website,
    isRegistered: searchResult.isRegistered,
    companyTypes: searchResult.companyTypes ?? [],
    ecoOrganismeAgreements: searchResult.ecoOrganismeAgreements ?? [],
    allowBsdasriTakeOverWithoutSignature:
      searchResult.allowBsdasriTakeOverWithoutSignature,
    transporterReceipt: searchResult.transporterReceipt,
    traderReceipt: searchResult.traderReceipt,
    brokerReceipt: searchResult.brokerReceipt,
    vhuAgrementDemolisseur: searchResult.vhuAgrementDemolisseur,
    vhuAgrementBroyeur: searchResult.vhuAgrementBroyeur
  };
}

export const getPublicCompanyInfos = async (
  orgId: string
): Promise<CompanyPublic> => {
  const companyInfos = (await getCompanyInfos(orgId)) as CompanyPublic;
  if (!["P", "N"].includes(companyInfos.statutDiffusionEtablissement!)) {
    return companyInfos;
  } else {
    // hide non-diffusible Company from public query
    return {
      orgId: companyInfos.orgId,
      siret: companyInfos.siret,
      vatNumber: companyInfos.vatNumber,
      isRegistered: companyInfos.isRegistered,
      companyTypes: companyInfos.companyTypes,
      ecoOrganismeAgreements: companyInfos.ecoOrganismeAgreements,
      statutDiffusionEtablissement: companyInfos.statutDiffusionEtablissement,
      etatAdministratif: companyInfos.etatAdministratif
    };
  }
};

/**
 * Public Query
 */
const companyInfosResolvers: QueryResolvers["companyInfos"] = async (
  _,
  args
) => {
  if (!args.siret && !args.clue) {
    throw new UserInputError(
      "Paramètre siret et clue absents. Un numéro SIRET ou de TVA intracommunautaire valide est requis",
      {
        invalidArgs: ["clue", "siret"]
      }
    );
  }

  const companyInfos = await getPublicCompanyInfos(
    !!args.siret ? args.siret : args.clue!
  );

  return companyInfos;
};

export default companyInfosResolvers;
