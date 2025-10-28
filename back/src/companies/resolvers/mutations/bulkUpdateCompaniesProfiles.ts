import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAdmin } from "../../../common/permissions";
import type {
  MutationBulkUpdateCompaniesProfilesArgs,
  CompanyPrivate
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { UserRole } from "@td/prisma";
import { bulkUpdateCompanySchema } from "../../validation/schema";
import { UserInputError } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../converters";
export async function bulkUpdateCompaniesProfiles(
  _,
  { input }: MutationBulkUpdateCompaniesProfilesArgs,
  context: GraphQLContext
): Promise<CompanyPrivate[]> {
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
  const adminOrgIds = adminCompanies.map(row => row.company.orgId);

  if (!adminOrgIds.length) {
    throw new Error("La liste est vide");
  }

  // any duplicates ?
  const inputOrgids = companyUpdateRows.map(row => row.orgId);
  if (inputOrgids.length !== new Set(inputOrgids).size) {
    throw new UserInputError(
      "La liste des établissements à mettre à jour comporte des doublons."
    );
  }
  // verification
  // iterate over each row
  const incorrectOrgids: string[] = [];

  for (const row of companyUpdateRows) {
    if (!adminOrgIds.includes(row.orgId)) {
      incorrectOrgids.push(row.orgId);
    }
    // are the types and subtypes coherent ?
    await bulkUpdateCompanySchema.parseAsync(row);
  }

  if (incorrectOrgids.length) {
    throw new UserInputError(
      `Certains établissements n'existent pas dans Trackdéchets ou l'email renseigné n'est pas celui de leur administrateur: ${incorrectOrgids.join(
        ","
      )}`
    );
  }

  // if all rows ok perform update
  const updatedCompanies: any[] = [];
  for (const row of companyUpdateRows) {
    const updatedCompany = await prisma.company.update({
      data: {
        companyTypes: row.companyTypes,
        collectorTypes: row.collectorTypes.filter(Boolean),
        wasteProcessorTypes: row.wasteProcessorTypes.filter(Boolean),
        wasteVehiclesTypes: row.wasteVehiclesTypes.filter(Boolean)
      },
      where: { orgId: row.orgId }
    });
    updatedCompanies.push(toGqlCompanyPrivate(updatedCompany));
  }

  return updatedCompanies;
}
