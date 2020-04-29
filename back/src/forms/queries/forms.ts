import { getUserCompanies } from "../../companies/queries";
import { unflattenObjectFromDb } from "../form-converter";
import { ForbiddenError } from "apollo-server-express";
import { prisma, Status } from "../../generated/prisma-client";
import { QueryFormsArgs, Form } from "../../generated/graphql/types";

export default async function forms(
  userId: string,
  { siret, type }: QueryFormsArgs
): Promise<Form[]> {
  const userCompanies = await getUserCompanies(userId);

  // TODO: require a SIRET if user has several companies ?
  const selectedCompany =
    siret != null
      ? userCompanies.find(uc => uc.siret === siret)
      : userCompanies.shift();

  if (!selectedCompany) {
    throw new ForbiddenError("Vous ne pouvez pas consulter les bordereaux.");
  }

  const statusIn: Status[] = ["SEALED", "SENT", "RESEALED", "RESENT"];

  const formsFilter = {
    ACTOR: {
      OR: [
        { recipientCompanySiret: selectedCompany.siret },
        { emitterCompanySiret: selectedCompany.siret },
        { ecoOrganisme: { siret: selectedCompany.siret } },
        {
          temporaryStorageDetail: {
            destinationCompanySiret: selectedCompany.siret
          }
        }
      ]
    },
    TRANSPORTER: {
      status_in: statusIn,
      OR: [
        { transporterCompanySiret: selectedCompany.siret },
        {
          temporaryStorageDetail: {
            transporterCompanySiret: selectedCompany.siret
          }
        }
      ]
    }
  };

  const queriedForms = await prisma.forms({
    where: {
      ...formsFilter[type],
      isDeleted: false
    }
  });

  return queriedForms.map(f => unflattenObjectFromDb(f));
}
