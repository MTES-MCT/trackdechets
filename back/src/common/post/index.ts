import mysendingboxBackend from "./backends/mysendingbox";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import consoleBackend from "./backends/console";
import { Company, UserRole } from "@prisma/client";
import { searchCompany } from "../../companies/sirene/";
import prisma from "../../prisma";

const backends = {
  console: consoleBackend,
  mysendingbox: mysendingboxBackend
};

const backend = backends[process.env.POST_BACKEND];

if (!backend) {
  throw new Error("Invalid post backend configuration: POST_BACKEND");
}

export function sendLetter(letter) {
  return backend.sendLetter(letter);
}

const template = fs.readFileSync(
  path.join(__dirname, "./templates/verificationCodeLetter.html"),
  { encoding: "utf8" }
);

export async function sendVerificationCodeLetter(company: Company) {
  const sireneInfo = await searchCompany(company.siret);
  const admin = await prisma.companyAssociation
    .findFirst({
      where: { companyId: company.id, role: UserRole.ADMIN }
    })
    .user();

  return sendLetter({
    description: "Code de vérification",
    to: {
      address_line1: sireneInfo.addressVoie,
      address_city: sireneInfo.addressCity,
      address_postalcode: sireneInfo.addressPostalCode,
      address_country: "France",
      company: company.name,
      name: admin.name
    },
    color: "bw",
    postage_type: "ecopli",
    from: {
      name: "Ministère de la Transition Écologique",
      address_line1: "La Grande Arche, paroi Sud",
      address_city: "Paris la Défense",
      address_postalcode: "92055",
      address_country: "France"
    },
    source_file: template,
    source_file_type: "html",
    variables: {
      company_name: company.name,
      company_siret: company.siret,
      company_created_at: format(company.createdAt, "yyyy-MM-dd"),
      user_email: admin.email,
      code: company.verificationCode
    }
  });
}
