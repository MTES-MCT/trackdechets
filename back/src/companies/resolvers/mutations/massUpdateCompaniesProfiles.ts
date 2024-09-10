import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import {
  MutationMassUpdateCompaniesProfilesArgs,
  MassUpdatedCompaniesProfile
} from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { UserRole } from "@prisma/client";
import { massUpdateCompanySchema } from "../../validation/schema";
import { UserInputError } from "../../../common/errors";

export async function massUpdateCompaniesProfiles(
  _,
  { input }: MutationMassUpdateCompaniesProfilesArgs,
  context: GraphQLContext
): Promise<MassUpdatedCompaniesProfile[]> {
  // restrict to UI
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const { adminEmail, companyUpdateRows } = input;

  // retrieve admin
  const adminUser = await prisma.user.findFirstOrThrow({
    where: { email: adminEmail }
  });

  // retrieve all admin companies
  const adminCompanies = await prisma.companyAssociation.findMany({
    where: { userId: adminUser.id, role: UserRole.ADMIN },
    include: { company: { select: { id: true, siret: true, orgId: true } } }
  });

  // build siret arrays
  const adminSirets = adminCompanies.map(row => row.company.siret);

  if (!adminSirets.length) {
    throw new Error("La liste est vide");
  }

  // any duplicates ?
  const inputSirets = companyUpdateRows.map(row => row.siret);
  if (inputSirets.length !== new Set(inputSirets).size) {
    throw new UserInputError(
      "La liste des établissements à mettre à jour comporte des doublons."
    );
  }
  // verification
  // iterate over each row
  const incorrectSirets: string[] = [];

  for (const row of companyUpdateRows) {
    if (!adminSirets.includes(row.siret)) {
      incorrectSirets.push(row.siret);
    }
    // are the types and subtypes coherent ?
    await massUpdateCompanySchema.parseAsync(row);
  }

  if (incorrectSirets.length) {
    throw new UserInputError(
      `Certains sirets n'existent pas dans Trackdéchets ou l'email renseigné n'est pas celui de leur administrateur: ${incorrectSirets.join(
        ","
      )}`
    );
  }

  // if all rows ok perform update
  const updatedCompanies: any[] = [];
  for (const row of companyUpdateRows) {
    const {
      siret,
      companyTypes,
      collectorTypes,
      wasteProcessorTypes,
      wasteVehiclesTypes
    } = await prisma.company.update({
      data: {
        companyTypes: row.companyTypes,
        collectorTypes: row.collectorTypes.filter(Boolean),
        wasteProcessorTypes: row.wasteProcessorTypes.filter(Boolean),
        wasteVehiclesTypes: row.wasteVehiclesTypes.filter(Boolean)
      },
      where: { siret: row.siret }
    });
    updatedCompanies.push({
      siret,
      companyTypes,
      collectorTypes,
      wasteProcessorTypes,
      wasteVehiclesTypes
    });
  }

  return updatedCompanies;
}
