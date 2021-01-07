import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { Company, prisma } from "../../../generated/prisma-client";
import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getUserCompanies } from "../../../users/database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getFormsRightFilter } from "../../database";
import { expandFormFromDb } from "../../form-converter";
import { getConnectionsArgs } from "../../pagination";

const formsResolver: QueryResolvers["forms"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);

  const { siret, status, roles, hasNextStep, ...rest } = args;

  let company: Company | null = null;

  if (siret) {
    // a siret is specified, check user has permission on this company
    company = await getCompanyOrCompanyNotFound({ siret });
    await checkIsCompanyMember({ id: user.id }, { siret });
  } else {
    const userCompanies = await getUserCompanies(user.id);

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

  // validate pagination arguments (skip, first, last, cursorAfter, cursorBefore)
  // and convert them to prisma connections args: (skip, first, last, after, before)
  const connectionsArgs = getConnectionsArgs({
    ...rest,
    defaultPaginateBy: 50,
    maxPaginateBy: 500
  });

  const queriedForms = await prisma.forms({
    ...connectionsArgs,
    orderBy: "createdAt_DESC",
    where: {
      updatedAt_gte: rest.updatedAfter,
      sentAt_gte: rest.sentAfter,
      wasteDetailsCode: rest.wasteCode,
      ...(status?.length && { status_in: status }),
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
};

function getHasNextStepFilter(siret: string, hasNextStep?: boolean | null) {
  if (hasNextStep == null) {
    return {};
  }

  const filter = {
    OR: [
      // DRAFT
      { status: "DRAFT" },
      // isTemporaryStorer && (RESENT || RECEIVED)
      {
        AND: [
          {
            temporaryStorageDetail: {
              destinationCompanySiret: siret
            }
          },
          {
            OR: [
              { status: "RESENT" },
              { status: "RECEIVED" },
              { status: "ACCEPTED" }
            ]
          }
        ]
      },
      // isRecipient && isTempStorage == isTempStorer
      // => isTempStorer && (SENT || TEMP_STORED)
      {
        AND: [
          { recipientCompanySiret: siret },
          { recipientIsTempStorage: true },
          {
            OR: [
              { status: "SENT" },
              { status: "TEMP_STORED" },
              { status: "TEMP_STORER_ACCEPTED" },
              { status: "RESEALED" }
            ]
          }
        ]
      },
      // isRecipient && (RECEIVED || ACCEPTED || (SENT && noTemporaryStorage))
      {
        AND: [
          { recipientCompanySiret: siret },
          {
            OR: [
              {
                AND: [{ status: "SENT" }, { recipientIsTempStorage: false }]
              },
              { status: "RECEIVED" },
              { status: "ACCEPTED" }
            ]
          }
        ]
      }
    ]
  };

  return hasNextStep ? filter : { NOT: filter };
}

export default formsResolver;
