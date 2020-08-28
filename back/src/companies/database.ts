import { CompanyWhereUniqueInput, prisma } from "../generated/prisma-client";
import { CompanyNotFound } from "./errors";

/**
 * Retrieves a company by siret or or throw a CompanyNotFound error
 */
export async function getCompanyOrCompanyNotFound({
  id,
  siret
}: CompanyWhereUniqueInput) {
  if (!id && !siret) {
    throw new Error("You should specify an id or a siret");
  }
  const company = await prisma.company(id ? { id } : { siret });
  if (company == null) {
    throw new CompanyNotFound();
  }
  return company;
}
