import { DomainError, ErrorCode } from "../../common/errors";
import { getUserCompanies } from "../../companies/queries";
import { GraphQLContext } from "../../types";
import { unflattenObjectFromDb } from "../form-converter";

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
    return new DomainError(
      "Vous ne pouvez pas consulter les bordereaux.",
      ErrorCode.FORBIDDEN
    );
  }

  const formsFilter = {
    ACTOR: {
      OR: [
        { recipientCompanySiret: selectedCompany.siret },
        { emitterCompanySiret: selectedCompany.siret }
      ]
    },
    TRANSPORTER: {
      transporterCompanySiret: selectedCompany.siret,
      status: "SEALED"
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
