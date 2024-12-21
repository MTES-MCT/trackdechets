import type { QueryResolvers } from "@td/codegen-back";

import { checkIsAdmin } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { prisma } from "@td/prisma";
import { searchCompanyTD } from "../../sirene/trackdechets/client";
import { searchCompanySirene } from "../../sirene/insee/client";
import { AnonymousCompany, Company } from "@prisma/client";
import { SireneSearchResult } from "../../sirene/types";
import { isSiret } from "@td/constants";
import { UserInputError } from "../../../common/errors";

const formatEtatAdministratif = etat => {
  if (etat === "A") return "A (Active)";
  if (etat === "F") return "F (Etablissement fermé)";
  if (etat === "C") return "C (Unité légale cessée)";
  return null;
};

const formatStatutDiffusion = status => {
  if (status === "O") return "O (Diffusible)";
  if (status === "P") return "P (Diffusion Partielle)";
  return null;
};

const formatAnonymousCompany = (company?: AnonymousCompany | null) => {
  return {
    siret: company?.siret,
    name: company?.name,
    contact: null,
    address: company?.address,
    createdAt: null,
    etatAdministratif: null,
    statutDiffusion: null,
    codeNaf: company?.codeNaf
  };
};

const formatDBCompany = (company?: Company | null) => {
  return {
    name: company?.name,
    siret: company?.siret,
    contact: company?.contact,
    address: company?.address,
    createdAt: company?.createdAt,
    etatAdministratif: null,
    statutDiffusion: null,
    codeNaf: company?.codeNaf
  };
};

const formatESCompany = (company?: SireneSearchResult | null) => {
  return {
    name: company?.name,
    siret: company?.siret,
    contact: null,
    address: company?.address,
    createdAt: null,
    etatAdministratif: formatEtatAdministratif(company?.etatAdministratif),
    statutDiffusion: formatStatutDiffusion(
      company?.statutDiffusionEtablissement
    ),
    codeNaf: company?.naf
  };
};

const formatSireneCompany = (company?: SireneSearchResult) => {
  return {
    name: company?.name,
    siret: company?.siret,
    contact: null,
    address: company?.address,
    createdAt: null,
    etatAdministratif: formatEtatAdministratif(company?.etatAdministratif),
    statutDiffusion: formatStatutDiffusion(
      company?.statutDiffusionEtablissement
    ),
    codeNaf: company?.naf
  };
};

const companyExhaustiveResolvers: QueryResolvers["companyExhaustive"] = async (
  _,
  { siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  if (!isSiret(siret)) {
    throw new UserInputError("Le siret renseigné n'est pas valide");
  }

  const anonymousCompany = await prisma.anonymousCompany.findFirst({
    where: { siret }
  });

  const dbCompany = await prisma.company.findFirst({
    where: { siret }
  });

  let esCompany;
  try {
    esCompany = await searchCompanyTD(siret);
  } catch (_) {
    //
  }

  let sireneCompany;
  try {
    sireneCompany = await searchCompanySirene(siret);
  } catch (_) {
    //
  }

  return {
    anonymousCompany: formatAnonymousCompany(anonymousCompany),
    dbCompany: formatDBCompany(dbCompany),
    esCompany: formatESCompany(esCompany),
    sireneCompany: formatSireneCompany(sireneCompany)
  };
};

export default companyExhaustiveResolvers;
