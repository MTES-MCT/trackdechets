import { getUserCompanies } from "../../companies/queries";
import { unflattenObjectFromDb } from "../form-converter";
import { FormStatus, FormType, FormRole } from "../../generated/types";
import { GraphQLContext } from "../../types";
import { prisma } from "../../generated/prisma-client";

const DEFAULT_FIRST = 50;

type FormsParams = {
  siret?: string;
  type?: FormType;
  roles?: FormRole[];
  status?: FormStatus[];
  hasNextStep?: boolean;
  first?: number;
  skip?: number;
};

export default async function forms(
  userId: string,
  {
    siret,
    type,
    roles,
    status,
    hasNextStep,
    first = DEFAULT_FIRST,
    skip = 0
  }: FormsParams
) {
  // TODO Remove `type` param and this code after deprecation warning period
  if (type && !roles) {
    roles = type === FormType.Actor ? [] : [FormRole.Transporter];
  }
  const userCompanies = await getUserCompanies(userId);

  const company =
    siret != null
      ? userCompanies.find(uc => uc.siret === siret)
      : userCompanies.shift();

  const queriedForms = await prisma.forms({
    first,
    skip,
    orderBy: "createdAt_DESC",
    where: {
      ...(status?.length && { status_in: status }),
      AND: [
        getRolesFilter(company.siret, roles),
        getHasNextStepFilter(siret, hasNextStep)
      ],
      isDeleted: false
    }
  });

  return queriedForms.map(f => unflattenObjectFromDb(f));
}

function getRolesFilter(siret: string, types: FormRole[]) {
  const filtersByRole = {
    [FormRole.Recipient]: [
      { recipientCompanySiret: siret },
      {
        temporaryStorageDetail: {
          destinationCompanySiret: siret
        }
      }
    ],
    [FormRole.Emitter]: [{ emitterCompanySiret: siret }],
    [FormRole.Transporter]: [
      { transporterCompanySiret: siret },
      {
        temporaryStorageDetail: {
          transporterCompanySiret: siret
        }
      }
    ],
    [FormRole.Trader]: [{ traderCompanySiret: siret }],
    [FormRole.EcoOrganisme]: [{ ecoOrganisme: { siret: siret } }]
  };

  return {
    OR: Object.keys(filtersByRole)
      .filter(type => (types?.length ? types.includes(type as FormRole) : true))
      .map(type => filtersByRole[type])
      .flat()
  };
}

function getHasNextStepFilter(siret: string, hasNextStep) {
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
