import {
  QueryResolvers,
  FormRole,
  QueryFormsArgs,
  Form
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../companies/queries";
import { prisma } from "../../../generated/prisma-client";
import { expandFormFromDb } from "../../form-converter";
import { UserInputError } from "apollo-server-express";
import { NotCompanyMember, MissingSiret } from "../../../common/errors";

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

const DEFAULT_FIRST = 50;

/**
 *
 * if type is TRANSPORTER, return forms:
 * - which status is in "SEALED", "SENT", "RESEALED", "RESENT"
 * - which transporterCompanySiret  or one segment's transporterCompanySiret matches selectedCompany siret
 * - which temporaryStorageDetail transporterCompanySiret matches selectedCompany siret
 *
 * if type is ACTOR (default), return forms:
 * - from any status
 * - which recipientCompanySiret, emitterCompanySiret, ecoOrganisme siret or temporaryStorageDetail destinationCompanySiret
 *  matches selectedCompany siret
 */
const formsResolver: QueryResolvers["forms"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);
  const validArgs = validateArgs(args);
  return getForms(user.id, validArgs);
};

export async function getForms(
  userId: string,
  { siret, status, roles, hasNextStep, ...rest }: QueryFormsArgs
): Promise<Form[]> {
  const first = rest.first ?? DEFAULT_FIRST;
  const skip = rest.skip ?? 0;

  const userCompanies = await getUserCompanies(user.id);

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
    first,
    skip,
    orderBy: "createdAt_DESC",
    where: {
      ...(status?.length && { status_in: status }),
      AND: [
        getRolesFilter(company.siret, roles ?? []),
        getHasNextStepFilter(company.siret, hasNextStep)
      ],
      isDeleted: false
    }
  });

  return queriedForms.map(f => expandFormFromDb(f));
}

function getRolesFilter(siret: string, roles: FormRole[]) {
  const filtersByRole = {
    ["RECIPIENT"]: [
      { recipientCompanySiret: siret },
      {
        temporaryStorageDetail: {
          destinationCompanySiret: siret
        }
      }
    ],
    ["EMITTER"]: [{ emitterCompanySiret: siret }],
    ["TRANSPORTER"]: [
      { transporterCompanySiret: siret },
      {
        transportSegments_some: {
          transporterCompanySiret: siret
        }
      },
      {
        temporaryStorageDetail: {
          transporterCompanySiret: siret
        }
      }
    ],
    ["TRADER"]: [{ traderCompanySiret: siret }],
    ["ECO_ORGANISME"]: [{ ecoOrganisme: { siret: siret } }]
  };

  return {
    OR: (Object.keys(filtersByRole) as Array<keyof typeof filtersByRole>)
      .filter(role => (roles.length > 0 ? roles.includes(role) : true))
      .map(role => filtersByRole[role])
      .flat()
  };
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

export default formsResolver;
