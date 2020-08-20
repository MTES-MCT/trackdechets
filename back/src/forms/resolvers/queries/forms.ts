import {
  QueryResolvers,
  FormRole,
  QueryFormsArgs
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getUserCompanies } from "../../../companies/queries";
import { prisma } from "../../../generated/prisma-client";
import { expandFormFromDb } from "../../form-converter";
import { UserInputError } from "apollo-server-express";

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

  const { siret, status, roles, hasNextStep, ...rest } = validateArgs(args);

  const first = rest.first ?? DEFAULT_FIRST;
  const skip = rest.skip ?? 0;

  const userCompanies = await getUserCompanies(user.id);

  const company =
    siret == null
      ? userCompanies.shift()
      : userCompanies.find(uc => uc.siret === siret);

  if (company == null) {
    return [];
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
};

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
