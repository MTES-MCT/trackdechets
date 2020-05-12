import { getUserCompanies } from "../../companies/queries";
import { unflattenObjectFromDb } from "../form-converter";
import { FormStatus, FormType, FormRole } from "../../generated/types";
import { GraphQLContext } from "../../types";

const DEFAULT_FIRST = 50;

type FormsParams = {
  siret: string;
  type: FormType;
  roles: FormRole[];
  status: FormStatus[];
  first: number;
  skip: number;
};

export default async function forms(
  _,
  { siret, type, roles, status, first = DEFAULT_FIRST, skip = 0 }: FormsParams,
  context: GraphQLContext
) {
  // TODO Remove `type` param and this code after deprecation warning period
  if (type && !roles) {
    roles = type === FormType.Actor ? [] : [FormRole.Transporter];
  }

  const userId = context.user.id;
  const userCompanies = await getUserCompanies(userId);

  const company =
    siret != null
      ? userCompanies.find(uc => uc.siret === siret)
      : userCompanies.shift();

  const queriedForms = await context.prisma.forms({
    first,
    skip,
    orderBy: "createdAt_DESC",
    where: {
      ...(status?.length && { status_in: status }),
      ...getRolesFilter(company.siret, roles),
      isDeleted: false
    }
  });

  return queriedForms.map(f => unflattenObjectFromDb(f));
}

function getRolesFilter(siretFilter: string, types: FormRole[]) {
  const filtersByRole = {
    [FormRole.Recipient]: [{ recipientCompanySiret: siretFilter }],
    [FormRole.Recipient]: [{ emitterCompanySiret: siretFilter }],
    [FormRole.Transporter]: [
      { transporterCompanySiret: siretFilter },
      {
        temporaryStorageDetail: {
          transporterCompanySiret: siretFilter
        }
      }
    ],
    [FormRole.Trader]: [{ traderCompanySiret: siretFilter }],
    [FormRole.EcoOrganisme]: [{ ecoOrganisme: { siret: siretFilter } }],
    [FormRole.TemporaryStorer]: [
      {
        temporaryStorageDetail: {
          destinationCompanySiret: siretFilter
        }
      }
    ]
  };

  return {
    OR: Object.keys(filtersByRole)
      .filter(type => (types?.length ? types.includes(type as FormRole) : true))
      .map(type => filtersByRole[type])
      .flat()
  };
}
