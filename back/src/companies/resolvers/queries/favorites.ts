import {
  CompanyFavorite,
  FavoriteType,
  QueryResolvers
} from "../../../generated/graphql/types";
import { Company, CompanyType, prisma } from "../../../generated/prisma-client";
import { searchCompany } from "../../sirene";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkIsCompanyMember } from "../../../users/permissions";

function matchesFavoriteType(
  company: Company,
  favoriteType: FavoriteType
): boolean {
  const EMITTER: CompanyType[] = ["PRODUCER", "ECO_ORGANISME"];
  const TRANSPORTER: CompanyType[] = ["TRANSPORTER"];
  const TRADER: CompanyType[] = ["TRADER"];
  const RECIPIENT: CompanyType[] = [
    "COLLECTOR",
    "WASTEPROCESSOR",
    "WASTE_VEHICLES",
    "WASTE_CENTER"
  ];
  const DESTINATION = RECIPIENT;
  const NEXT_DESTINATION = RECIPIENT;
  const TEMPORARY_STORAGE_DETAIL = RECIPIENT;

  const COMPANY_TYPES: Record<FavoriteType, CompanyType[]> = {
    EMITTER,
    TRANSPORTER,
    TRADER,
    RECIPIENT,
    DESTINATION,
    NEXT_DESTINATION,
    TEMPORARY_STORAGE_DETAIL
  };

  return COMPANY_TYPES[favoriteType].some(matchingCompanyType =>
    company.companyTypes.includes(matchingCompanyType)
  );
}

const favoritesResolver: QueryResolvers["favorites"] = async (
  parent,
  { siret, type },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyMember({ id: user.id }, { siret: company.siret });

  const lowerType = type.toLowerCase();

  const forms = await prisma.forms({
    where: {
      OR: [
        { owner: { id: user.id } },
        { recipientCompanySiret: company.siret },
        { emitterCompanySiret: company.siret }
      ],
      AND: {
        [`${lowerType}CompanySiret_not`]: null
      },
      isDeleted: false
    },
    orderBy: "updatedAt_DESC",

    // Take more than needed as duplicates are filtered out
    first: 50
  });

  const favorites: CompanyFavorite[] = forms
    .map(form => ({
      name: form[`${lowerType}CompanyName`],
      siret: form[`${lowerType}CompanySiret`],
      address: form[`${lowerType}CompanyAddress`],
      contact: form[`${lowerType}CompanyContact`],
      phone: form[`${lowerType}CompanyPhone`],
      mail: form[`${lowerType}CompanyMail`]
    }))
    // Remove duplicates (by company siret)
    .reduce<CompanyFavorite[]>((prev, cur) => {
      if (prev.find(el => el.siret === cur.siret) == null) {
        return prev.concat([cur]);
      }
      return prev;
    }, []);

  if (
    // the user's company matches the provided favorite type
    matchesFavoriteType(company, type) &&
    // their company is not included in the results yet
    favorites.find(favorite => favorite.siret === company.siret) == null
  ) {
    // append their own company to the results
    const companySearchResult = await searchCompany(company.siret);
    favorites.push({
      name: company.name,
      siret: company.siret,
      address: companySearchResult.address,
      contact: user.name,
      phone: user.phone,
      mail: user.email
    });
  }

  // Return up to 10 results
  favorites.splice(10);

  return favorites;
};

export default favoritesResolver;
