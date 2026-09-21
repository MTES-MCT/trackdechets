import { UserInputError } from "../../../common/errors";
import type { CompanyPublic, QueryResolvers } from "@td/codegen-back";
import { getInstallation } from "../../database";
import { searchCompany } from "../../search";
import { ClosedCompanyError } from "../../sirene/errors";
import { isClosedCompany } from "@td/constants";

/**
 * Recherche et renvoie les données diffusables
 * sur une entreprise pour un SIRET ou de TVA
 * Fusionnant les infos des bases Trackdéchets et S3IC
 * si elles existent
 * @param siretOrVat
 */
export async function getCompanyInfos(
  siretOrVat: string
): Promise<CompanyPublic> {
  if (!siretOrVat) {
    throw new UserInputError(
      "Paramètre absent. Un SIRET ou de TVA intracommunautaire valide est requis",
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
    wasteProcessorTypes: searchResult.wasteProcessorTypes ?? [],
    wasteVehiclesTypes: searchResult.wasteVehiclesTypes ?? [],
    collectorTypes: searchResult.collectorTypes ?? [],
    ecoOrganismeAgreements: searchResult.ecoOrganismeAgreements ?? [],
    allowBsdasriTakeOverWithoutSignature:
      searchResult.allowBsdasriTakeOverWithoutSignature,
    transporterReceipt: searchResult.transporterReceipt,
    traderReceipt: searchResult.traderReceipt,
    brokerReceipt: searchResult.brokerReceipt,
    vhuAgrementDemolisseur: searchResult.vhuAgrementDemolisseur,
    vhuAgrementBroyeur: searchResult.vhuAgrementBroyeur,
    isDormant: searchResult.isDormant,
    ecoOrganismePartnersIds: searchResult.ecoOrganismePartnersIds ?? []
  };
}

/**
 * Public Query
 */
const companyInfosResolvers: QueryResolvers["companyInfos"] = async (
  _,
  args
) => {
  if (!args.siret && !args.clue) {
    throw new UserInputError(
      "Paramètre siret et clue absents. Un SIRET ou de TVA intracommunautaire valide est requis",
      {
        invalidArgs: ["clue", "siret"]
      }
    );
  }
  const companyInfos = await getCompanyInfos(args.siret ?? args.clue!);

  if (isClosedCompany(companyInfos)) {
    throw new ClosedCompanyError();
  }

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
      etatAdministratif: companyInfos.etatAdministratif,
      allowBsdasriTakeOverWithoutSignature:
        companyInfos.allowBsdasriTakeOverWithoutSignature,
      isDormant: companyInfos.isDormant,
      ecoOrganismePartnersIds: companyInfos.ecoOrganismePartnersIds
    };
  }
};

export default companyInfosResolvers;
