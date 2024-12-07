import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MissingSiret } from "../../../common/errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "@td/codegen-back";
import { Company, Status, Prisma } from "@prisma/client";
import { prisma } from "@td/prisma";
import { getUserCompanies } from "../../../users/database";
import { getFormsRightFilter } from "../../database";
import { expandFormFromDb, expandableFormIncludes } from "../../converter";
import { getPrismaPaginationArgs } from "../../../common/pagination";
import { checkCanList } from "../../permissions";

const MAX_FORMS_LIMIT = 100;

const formsResolver: QueryResolvers["forms"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);

  const { siret, status, roles, hasNextStep, ...rest } = args;

  let company: Company | null = null;

  if (siret) {
    // a siret is specified, check user has permission on this company
    company = await getCompanyOrCompanyNotFound({ orgId: siret });
    await checkCanList(user, siret);
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

  const gqlPaginationArgs = {
    first: rest.first,
    after: rest.cursorAfter,
    last: rest.last,
    before: rest.cursorBefore,
    skip: rest.skip,
    maxPaginateBy: MAX_FORMS_LIMIT
  };

  const paginationArgs = getPrismaPaginationArgs(gqlPaginationArgs);

  const queriedForms = await prisma.form.findMany({
    ...paginationArgs,
    orderBy: { rowNumber: "desc" },
    where: {
      ...(rest.updatedAfter && {
        updatedAt: { gte: new Date(rest.updatedAfter) }
      }),
      ...(rest.sentAfter && { sentAt: { gte: new Date(rest.sentAfter) } }),
      ...(rest.wasteCode && { wasteDetailsCode: rest.wasteCode }),
      ...(rest.customId && { customId: rest.customId }),
      ...(status?.length && { status: { in: status } }),
      AND: [
        getFormsRightFilter(company.orgId, roles),
        getHasNextStepFilter(company.orgId, hasNextStep),
        ...(rest.siretPresentOnForm
          ? [getFormsRightFilter(rest.siretPresentOnForm, [])]
          : [])
      ],
      isDeleted: false,
      readableId: { not: { endsWith: "-suite" } }
    },
    include: expandableFormIncludes
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
                  // Installation de destination finale
                  // No join equivalent to {forwardedIn: { recipientCompanySiret: siret }}
                  { recipientsSirets: { has: siret } },
                  { recipientCompanySiret: { not: siret } },
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
