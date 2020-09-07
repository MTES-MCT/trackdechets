import { QueryResolvers } from "../../../generated/graphql/types";
import { searchCompany } from "../../sirene";
import { getUserCompanies } from "../../../users/database";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";

const favoritesResolver: QueryResolvers["favorites"] = async (
  parent,
  { type },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const lowerType = type.toLowerCase();
  const userId = user.id;
  const companies = await getUserCompanies(userId);

  if (!companies.length) {
    throw new Error(
      `Vous n'appartenez à aucune entreprise, vous n'avez pas de favori.`
    );
  }

  const forms = await prisma.forms({
    where: {
      OR: [
        { owner: { id: userId } },
        { recipientCompanySiret: companies[0].siret },
        { emitterCompanySiret: companies[0].siret }
      ],
      isDeleted: false
    },
    orderBy: "createdAt_DESC",
    first: 50
  });

  const favorites = forms
    // Filter out forms with no data
    .filter(f => f[`${lowerType}CompanySiret`])
    .map(f => ({
      name: f[`${lowerType}CompanyName`],
      siret: f[`${lowerType}CompanySiret`],
      address: f[`${lowerType}CompanyAddress`],
      contact: f[`${lowerType}CompanyContact`],
      phone: f[`${lowerType}CompanyPhone`],
      mail: f[`${lowerType}CompanyMail`]
    }))
    // Remove duplicates (by company names)
    .reduce((prev, cur) => {
      if (prev.findIndex(el => el.name === cur.name) === -1) {
        prev.push(cur);
      }
      return prev;
    }, [])
    .slice(0, 10);

  // If there is no data yet, propose his own companies as favorites
  // We won't have every props populated, but it's a start
  if (!favorites.length) {
    return Promise.all(companies.map(c => searchCompany(c.siret)));
  }

  return favorites;
};

export default favoritesResolver;
