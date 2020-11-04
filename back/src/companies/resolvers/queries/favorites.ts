import {
  CompanyFavorite,
  FavoriteType,
  QueryResolvers
} from "../../../generated/graphql/types";
import {
  Company,
  CompanyType,
  prisma,
  TemporaryStorageDetail
} from "../../../generated/prisma-client";
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

async function getCompanies(
  userID: string,
  siret: string,
  type: FavoriteType
): Promise<CompanyFavorite[]> {
  switch (type) {
    case "TEMPORARY_STORAGE_DETAIL": {
      const forms = await prisma.forms({
        where: {
          OR: [
            { owner: { id: userID } },
            { recipientCompanySiret: siret },
            { emitterCompanySiret: siret }
          ],
          AND: {
            recipientIsTempStorage: true,
            recipientCompanySiret_not: null
          },
          isDeleted: false
        },
        orderBy: "updatedAt_DESC",
        first: 50
      });
      return forms.map(form => ({
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyAddress,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      }));
    }
    case "DESTINATION": {
      const forms = await prisma.forms({
        where: {
          OR: [
            { owner: { id: userID } },
            { recipientCompanySiret: siret },
            { emitterCompanySiret: siret }
          ],
          AND: {
            recipientIsTempStorage: true,
            recipientCompanySiret_not: null
          },
          isDeleted: false
        },
        orderBy: "updatedAt_DESC",
        first: 50
      }).$fragment<
        Array<{ temporaryStorageDetail: TemporaryStorageDetail }>
      >(`fragment TemporaryStorageDetail on Form {
        temporaryStorageDetail {
          destinationCompanyName
          destinationCompanySiret
          destinationCompanyAddress
          destinationCompanyContact
          destinationCompanyPhone
          destinationCompanyMail
        }
      }`);
      return forms.map(form => ({
        name: form.temporaryStorageDetail.destinationCompanyName,
        siret: form.temporaryStorageDetail.destinationCompanySiret,
        address: form.temporaryStorageDetail.destinationCompanyAddress,
        contact: form.temporaryStorageDetail.destinationCompanyContact,
        phone: form.temporaryStorageDetail.destinationCompanyPhone,
        mail: form.temporaryStorageDetail.destinationCompanyMail
      }));
    }
    case "EMITTER":
    case "TRANSPORTER":
    case "RECIPIENT":
    case "TRADER":
    case "NEXT_DESTINATION": {
      const lowerType = type.toLowerCase();
      const forms = await prisma.forms({
        where: {
          OR: [
            { owner: { id: userID } },
            { recipientCompanySiret: siret },
            { emitterCompanySiret: siret }
          ],
          AND: {
            [`${lowerType}CompanySiret_not`]: null
          },
          isDeleted: false
        },
        orderBy: "updatedAt_DESC",
        first: 50
      });

      return forms.map(form => ({
        name: form[`${lowerType}CompanyName`],
        siret: form[`${lowerType}CompanySiret`],
        address: form[`${lowerType}CompanyAddress`],
        contact: form[`${lowerType}CompanyContact`],
        phone: form[`${lowerType}CompanyPhone`],
        mail: form[`${lowerType}CompanyMail`]
      }));
    }
    default:
      return [];
  }
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

  const favorites: CompanyFavorite[] = (
    await getCompanies(user.id, company.siret, type)
  )
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
