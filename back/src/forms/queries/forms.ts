import { getUserCompanies } from "../../companies/queries";
import { unflattenObjectFromDb } from "../form-converter";
import { FormRole, QueryFormsArgs } from "../../generated/graphql/types";
import { prisma } from "../../generated/prisma-client";

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
export default async function forms(
  userId: string,
  { siret, type, status, hasNextStep, ...rest }: QueryFormsArgs
) {
  const first = rest.first ?? DEFAULT_FIRST;
  const skip = rest.skip ?? 0;
  const roles: FormRole[] =
    // TODO Remove `type` param and this code after deprecation warning period
    type && !rest.roles
      ? type === "ACTOR"
        ? []
        : ["TRANSPORTER"]
      : rest.roles ?? [];

  const userCompanies = await getUserCompanies(userId);

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
        getRolesFilter(company.siret, roles),
        getHasNextStepFilter(company.siret, hasNextStep)
      ],
      isDeleted: false
    }
  });

  return queriedForms.map(f => unflattenObjectFromDb(f));
}

function getRolesFilter(siret: string, roles: FormRole[]) {
  if (roles.length <= 0) {
    return {};
  }

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
      .filter(role => roles.includes(role))
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
