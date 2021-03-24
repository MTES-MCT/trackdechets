import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { Company, Status, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
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

  const queriedForms = await prisma.form.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where: {
      ...(rest.updatedAfter && {
        updatedAt: { gte: new Date(rest.updatedAfter) }
      }),
      ...(rest.sentAfter && { sentAt: { gte: new Date(rest.sentAfter) } }),
      wasteDetailsCode: rest.wasteCode,
      ...(status?.length && { status: { in: status } }),
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

  const filter: Prisma.FormWhereInput = {
    OR: [
      // nextStep = markAsSealed
      { status: Status.DRAFT },
      {
        AND: [
          // BSD avec acheminement direct du producteur à l'installation de destination
          { recipientIsTempStorage: false },
          { recipientCompanySiret: siret }, // installation de destination
          {
            status: {
              in: [
                Status.SENT, // nextStep = markAsReceived
                Status.RECEIVED, // nextStep = markAsAccepted
                Status.ACCEPTED // nextStep = markAsProcessed
              ]
            }
          }
        ]
      },
      {
        AND: [
          { recipientIsTempStorage: true }, // BSD avec entreposage provisoire
          {
            OR: [
              {
                AND: [
                  { recipientCompanySiret: siret }, // installation d'entreposage provisoire
                  {
                    status: {
                      in: [
                        Status.SENT, // nextStep = markAsTempStored
                        Status.TEMP_STORED, // nextStep = markAsTempStorerAccepted
                        Status.TEMP_STORER_ACCEPTED // nextStep = markAsResealed
                      ]
                    }
                  }
                ]
              },
              {
                AND: [
                  {
                    temporaryStorageDetail: { destinationCompanySiret: siret } // installation de destination finale
                  },
                  {
                    status: {
                      in: [
                        Status.RESENT, // nextStep = markAsReceived
                        Status.RECEIVED, // nextStep = markAsAccepted
                        Status.ACCEPTED // nextStep = markAsProcessed
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  return hasNextStep ? filter : { NOT: filter };
}

export default formsResolver;
