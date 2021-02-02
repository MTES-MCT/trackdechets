import { expandDasriFromDb } from "../../dasri-converter";
import { Dasri, QueryResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { Company, DasriStatus } from "@prisma/client";
import { MissingSiret } from "../../../common/errors";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { getUserCompanies } from "../../../users/database";
import { getCursorConnectionsArgs } from "../../cursorPagination";
import { getDasrisRightFilter } from "../../../dasris/database";

export async function getDasris(): Promise<Dasri[]> {
  const queried = await prisma.dasri.findMany();
  return queried.map(f => expandDasriFromDb(f));
}

const dasrisResolver: QueryResolvers["dasris"] = async (_, args, context) => {
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

  const connectionsArgs = getCursorConnectionsArgs({
    ...rest,
    defaultPaginateBy: 50,
    maxPaginateBy: 500
  });

  const queried = await prisma.dasri.findMany({
    ...connectionsArgs,
    orderBy: { createdAt: "desc" },
    where: {
      ...(rest.updatedAfter && {
        updatedAt: { gte: new Date(rest.updatedAfter) }
      }),
      wasteDetailsCode: rest.wasteCode,
      ...(status?.length && { status: { in: status } }),
      AND: [
        getDasrisRightFilter(company.siret, roles),
        getHasNextStepFilter(company.siret, hasNextStep),

        ...(rest.siretPresentOnForm
          ? [getDasrisRightFilter(rest.siretPresentOnForm, [])]
          : [])
      ],

      isDeleted: false
    }
  });
  return queried.map(f => expandDasriFromDb(f));
};

export default dasrisResolver;

function getHasNextStepFilter(siret: string, hasNextStep?: boolean | null) {
  if (hasNextStep == null) {
    return {};
  }

  const filter = {
    OR: [
      // DRAFT
      { status: DasriStatus.DRAFT },
      // isEmitter && SEALED
      {
        AND: [{ emitterCompanySiret: siret }, { status: DasriStatus.SEALED }]
      },
      // isRecipient && (RECEIVED || ACCEPTED )
      {
        AND: [
          { recipientCompanySiret: siret },
          {
            OR: [{ status: DasriStatus.SENT }, { status: DasriStatus.RECEIVED }]
          }
        ]
      }
    ]
  };

  return hasNextStep ? filter : { NOT: filter };
}
