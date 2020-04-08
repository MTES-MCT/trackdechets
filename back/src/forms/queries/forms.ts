import { getUserCompanies } from "../../companies/queries";
import { GraphQLContext } from "../../types";
import { unflattenObjectFromDb } from "../form-converter";
import { ForbiddenError } from "apollo-server-express";

export default async function forms(
  _,
  { siret, type },
  context: GraphQLContext
) {
  const userId = context.user.id;
  const userCompanies = await getUserCompanies(userId);

  // TODO: require a SIRET if user has several companies ?
  const selectedCompany =
    siret != null
      ? userCompanies.find(uc => uc.siret === siret)
      : userCompanies.shift();

  if (!selectedCompany) {
    throw new ForbiddenError("Vous ne pouvez pas consulter les bordereaux.");
  }

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
      status_in: ["SEALED", "SENT", "RESEALED", "RESENT"],
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

  const queriedForms = await context.prisma.forms({
    where: {
      ...formsFilter[type],
      isDeleted: false
    }
  });

  return queriedForms.map(f => unflattenObjectFromDb(f));
}
