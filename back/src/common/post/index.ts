import mysendingboxBackend from "./backends/mysendingbox";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import consoleBackend from "./backends/console";
import { Company, UserRole } from "@prisma/client";
import { searchCompany } from "../../companies/search";
import { prisma } from "@td/prisma";

const backend =
  process.env.MY_SENDING_BOX_API_KEY &&
  process.env.MY_SENDING_BOX_API_KEY.length > 0
    ? mysendingboxBackend
    : consoleBackend;

export function sendLetter(letter) {
  return backend.sendLetter(letter);
}

const template = fs.readFileSync(
  path.join(__dirname, "./templates/verificationCodeLetter.html"),
  { encoding: "utf8" }
);

function truncate(s: string) {
  return s?.slice(0, 45) ?? "";
}

export async function sendVerificationCodeLetter(company: Company) {
  if (!company.siret) {
    throw new Error(
      `Cannot send verification code letter, company ${company.id} hyas no siret`
    );
  }
  const sireneInfo = await searchCompany(company.siret);
  const admin = await prisma.companyAssociation
    .findFirst({
      where: { companyId: company.id, role: UserRole.ADMIN }
    })
    .user();

  if (admin) {
    return sendLetter({
      description: "Code de vérification",
      to: {
        address_line1: truncate(sireneInfo.addressVoie ?? ""),
        address_city: truncate(sireneInfo.addressCity ?? ""),
        address_postalcode: sireneInfo.addressPostalCode,
        address_country: "France",
        company: truncate(company.name),
        name: truncate(admin.name)
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
  } else {
    throw new Error(
      `Impossible d'envoyer un courrier de vérification à l'établissement ${company.siret} car il ne possède pas d'administrateur`
    );
  }
}
