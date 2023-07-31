import prisma from "../../../prisma";
import {
  MutationUpdateCompanyArgs,
  CompanyPrivate
} from "../../../generated/graphql/types";
import * as yup from "yup";
import { convertUrls } from "../../database";

export async function updateCompanyFn({
  id,
  companyTypes,
  gerepId,
  contact,
  contactEmail,
  contactPhone,
  website,
  givenName,
  ecoOrganismeAgreements,
  allowBsdasriTakeOverWithoutSignature
}: MutationUpdateCompanyArgs): Promise<CompanyPrivate> {
  const data = {
    ...(companyTypes != null ? { companyTypes: { set: companyTypes } } : {}),
    ...(gerepId != null ? { gerepId } : {}),
    ...(contact != null ? { contact } : {}),
    ...(contactEmail != null ? { contactEmail } : {}),
    ...(contactPhone != null ? { contactPhone } : {}),
    ...(website != null ? { website } : {}),
    ...(givenName != null ? { givenName } : {}),
    ...(allowBsdasriTakeOverWithoutSignature !== null
      ? { allowBsdasriTakeOverWithoutSignature }
      : {}),
    ...(ecoOrganismeAgreements != null
      ? {
          ecoOrganismeAgreements: {
            set: ecoOrganismeAgreements.map(a => a.toString())
          }
        }
      : {})
  };
  const companySchema = yup.object().shape({
    website: yup.string().url("L'url est invalide")
  });
  // A string like javascript:alert("p0wned") might be reflected on company public page
  // this is not filtered by the xss middleware
  await companySchema.validate(data);
  const company = await prisma.company.update({
    where: { id },
    data
  });

  return convertUrls(company);
}
