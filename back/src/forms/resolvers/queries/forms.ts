import { UserInputError } from "apollo-server-express";
import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import {
  Form,
  QueryFormsArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { Company, prisma } from "../../../generated/prisma-client";
import { getUserCompanies } from "../../../users/database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getFormsRightFilter } from "../../database";
import { expandFormFromDb } from "../../form-converter";

function validateArgs(args: QueryFormsArgs) {
  if (args.first < 1 || args.first > 500) {
    throw new UserInputError(
      "Le paramètre `first` doit être compris entre 1 et 500"
    );
  }
  // DEPRECATED. To remove with skip
  if (args.skip < 0) {
    throw new UserInputError("Le paramètre `skip` doit être positif");
  }
  return args;
}

const DEFAULT_PAGINATE_BY = 50;

const formsResolver: QueryResolvers["forms"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);
  const validArgs = validateArgs(args);
  return getForms(user.id, validArgs);
};

export async function getForms(
  userId: string,
  { siret, status, roles, hasNextStep, ...rest }: QueryFormsArgs
): Promise<Form[]> {
  let company: Company | null = null;

  if (siret) {
    // a siret is specified, check user has permission on this company
    company = await getCompanyOrCompanyNotFound({ siret });
    await checkIsCompanyMember({ id: userId }, { siret });
  } else {
    const userCompanies = await getUserCompanies(userId);

    if (userCompanies.length === 0) {
      // the user is not member of any companies, return empty array
      return [];
    }

    if (userCompanies.length > 1) {
      // the user is member of 2 companies or more, a siret is required
      throw new MissingSiret();
    }

    // the user is member of only one company, use it as default
    company = userCompanies[0];
  }

  const queriedForms = await prisma.forms({
    ...getPaginationFilter(rest),
    orderBy: "createdAt_DESC",
    where: {
      updatedAt_gte: rest.updatedAfter,
      sentAt_gte: rest.sentAfter,
      wasteDetailsCode: rest.wasteCode,
      ...(status?.length && { statusEnum_in: status }),
      AND: [
        getFormsRightFilter(company.siret, roles),
        getHasNextStepFilter(company.siret, hasNextStep),
        ...(rest.siretPresentOnForm
          ? [getFormsRightFilter(rest.siretPresentOnForm, [])]
          : [])
      ],
      isDeleted: false
    }
  });

  return queriedForms.map(f => expandFormFromDb(f));
}

function getHasNextStepFilter(siret: string, hasNextStep?: boolean | null) {
  if (hasNextStep == null) {
    return {};
  }

  const filter = {
    OR: [
      // DRAFT
      { statusEnum: "DRAFT" },
      // isEmitter && SEALED
      { AND: [{ emitterCompanySiret: siret }, { statusEnum: "SEALED" }] },
      // isTemporaryStorer && (RESENT || RECEIVED)
      {
        AND: [
          {
            temporaryStorageDetail: {
              destinationCompanySiret: siret
            }
          },
          { OR: [{ statusEnum: "RESENT" }, { statusEnum: "RECEIVED" }] }
        ]
      },
      // isRecipient && isTempStorage == isTempStorer
      // => isTempStorer && (SENT || TEMP_STORED || RESEALED)
      {
        AND: [
          { recipientCompanySiret: siret },
          { recipientIsTempStorage: true },
          {
            OR: [
              { statusEnum: "SENT" },
              { statusEnum: "TEMP_STORED" },
              { statusEnum: "RESEALED" }
            ]
          }
        ]
      },
      // isRecipient && (RECEIVED || (SENT && noTemporaryStorage))
      {
        AND: [
          { recipientCompanySiret: siret },
          {
            OR: [
              {
                AND: [{ statusEnum: "SENT" }, { recipientIsTempStorage: false }]
              },
              { statusEnum: "RECEIVED" }
            ]
          }
        ]
      }
    ]
  };

  return hasNextStep ? filter : { NOT: filter };
}

function getPaginationFilter({
  first = DEFAULT_PAGINATE_BY,
  last = DEFAULT_PAGINATE_BY,
  skip,
  cursorAfter: after,
  cursorBefore: before
}: Partial<QueryFormsArgs>) {
  // DEPRECATED. To remove with skip
  if (skip) {
    return {
      first,
      skip
    };
  }

  if (before) {
    return {
      before,
      last
    };
  }

  // By default, if no cursorAfter is provided we'll return the first elements
  return {
    after,
    first
  };
}

export default formsResolver;
