import { UserInputError } from "apollo-server-express";
import { MissingSiret, NotCompanyMember } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  Form,
  QueryFormsArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { getUserCompanies } from "../../../users/database";
import { getFormsRightFilter } from "../../database";
import { expandFormFromDb } from "../../form-converter";

// DEPRECATED. To remove with && skip
function validateArgs(args: QueryFormsArgs) {
  if (args.first < 0 || args.first > 500) {
    throw new UserInputError(
      "Le paramètre `first` doit être compris entre 1 et 500"
    );
  }
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
  const userCompanies = await getUserCompanies(userId);

  let company = null;

  if (siret) {
    // a siret is specified, check user has permission on this company
    company = userCompanies.find(uc => uc.siret === siret);
    if (!company) {
      throw new NotCompanyMember(siret);
    }
  } else {
    if (userCompanies.length === 0) {
      // the user is not member of any companies, return empty array
      return [];
    } else if (userCompanies.length > 1) {
      // the user is member of 2 companies or more, a siret is required
      throw new MissingSiret();
    } else {
      // the user is member of only one company, use it as default
      company = userCompanies[0];
    }
  }

  const queriedForms = await prisma.forms({
    ...getPaginationFilter(rest),
    orderBy: "createdAt_DESC",
    where: {
      ...(status?.length && { status_in: status }),
      AND: [
        getFormsRightFilter(company.siret, roles),
        getHasNextStepFilter(company.siret, hasNextStep)
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
      { status: "DRAFT" },
      // isEmitter && SEALED
      { AND: [{ emitterCompanySiret: siret }, { status: "SEALED" }] },
      // isTemporaryStorer && (RESENT || RECEIVED)
      {
        AND: [
          {
            temporaryStorageDetail: {
              destinationCompanySiret: siret
            }
          },
          { OR: [{ status: "RESENT" }, { status: "RECEIVED" }] }
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
              { status: "SENT" },
              { status: "TEMP_STORED" },
              { status: "RESEALED" }
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
                AND: [{ status: "SENT" }, { recipientIsTempStorage: false }]
              },
              { status: "RECEIVED" }
            ]
          }
        ]
      }
    ]
  };

  return hasNextStep ? filter : { NOT: filter };
}

function getPaginationFilter({
  first,
  skip,
  cursorAfter: after,
  cursorBefore: before,
  formsPerPage = DEFAULT_PAGINATE_BY
}: Partial<QueryFormsArgs>) {
  // DEPRECATED. To remove with && skip
  if (first || skip) {
    return {
      first: first,
      skip: skip ?? 0
    };
  }

  if (before) {
    return {
      before,
      last: formsPerPage
    };
  }

  // By default, if no cursorAfter is provided we'll return the first elements
  return {
    after,
    first: formsPerPage
  };
}

export default formsResolver;
