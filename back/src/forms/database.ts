/**
 * PRISMA HELPER FUNCTIONS
 */

import { BsddTransporter, Form, Prisma } from "@prisma/client";
import prisma from "../prisma";
import { FormRole } from "../generated/graphql/types";
import { FormNotFound, FormTransporterNotFound } from "./errors";
import { FullForm } from "./types";
import { UserInputError } from "../common/errors";

/**
 * Returns a prisma Form with all linked objects
 * (owner, ecoOrganisme, temporaryStorage, transporters, intermediaries)
 * @param form
 */
export async function getFullForm(form: Form): Promise<FullForm> {
  const forwardedIn = await prisma.form
    .findUnique({ where: { id: form.id } })
    .forwardedIn({ include: { transporters: true } });
  const transporters = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .transporters();
  const intermediaries = await prisma.form
    .findUnique({
      where: { id: form.id }
    })
    .intermediaries();

  if (forwardedIn) {
    forwardedIn.transporters = getTransportersSync({
      transporters: forwardedIn.transporters
    }); // make sure transporters are sorted
  }

  return {
    ...form,
    forwardedIn,
    transporters: getTransportersSync({ transporters }), // make sure transporters are sorted
    intermediaries
  };
}

/**
 * Retrieves a form by id or readableId or throw a FormNotFound error
 */
export async function getFormOrFormNotFound({
  id,
  readableId
}: Prisma.FormWhereUniqueInput) {
  if (!id && !readableId) {
    throw new UserInputError("You should specify an id or a readableId");
  }
  const form = await prisma.form.findUnique({
    where: id ? { id } : { readableId }
  });
  if (
    form == null ||
    form.isDeleted == true ||
    form.readableId.endsWith("-suite")
  ) {
    throw new FormNotFound(id ? id.toString() : readableId!);
  }
  return form;
}

export async function getFormTransporterOrNotFound({ id }: { id: string }) {
  if (!id) {
    throw new UserInputError(
      "Vous devez préciser un identifiant de transporteur"
    );
  }

  const transporter = await prisma.bsddTransporter.findUnique({
    where: { id }
  });

  if (transporter === null) {
    throw new FormTransporterNotFound(id);
  }

  return transporter;
}

/**
 * Get a filter to retrieve forms the passed siret has rights on
 * Optional parameter roles allows to filter on specific roles
 * For example getFormsRightFilter(company, [TRANSPORTER]) will return a filter
 * only for the forms in which the company appears as a transporter
 * @param siret the siret to filter on
 * @param roles optional [FormRole] to refine filter
 */
export function getFormsRightFilter(
  siret: string,
  roles?: FormRole[] | null
): Prisma.FormWhereInput {
  const filtersByRole: {
    [key in FormRole]: Partial<Prisma.FormWhereInput>[];
  } = {
    ["RECIPIENT"]: [{ recipientsSirets: { has: siret } }],
    ["EMITTER"]: [{ emitterCompanySiret: siret }],
    ["TRANSPORTER"]: [{ transportersSirets: { has: siret } }],
    ["TRADER"]: [{ traderCompanySiret: siret }],
    ["BROKER"]: [{ brokerCompanySiret: siret }],
    ["ECO_ORGANISME"]: [{ ecoOrganismeSiret: siret }],
    ["INTERMEDIARY"]: [{ intermediariesSirets: { has: siret } }]
  };

  function getCommonORFilter({
    defaultToAllRoles
  }: {
    defaultToAllRoles: boolean;
  }) {
    return {
      OR: Object.keys(filtersByRole)
        .filter((role: FormRole) => {
          if (roles && roles.length > 0) {
            return roles.includes(role);
          }
          return defaultToAllRoles;
        })
        .map(role => filtersByRole[role])
        .flat()
    };
  }

  return {
    OR: [
      {
        status: { not: "DRAFT" },
        ...getCommonORFilter({ defaultToAllRoles: true })
      },
      {
        status: "DRAFT",
        canAccessDraftSirets: { has: siret },
        ...(roles && getCommonORFilter({ defaultToAllRoles: false }))
      }
    ]
  };
}

export const SIRETS_BY_ROLE_INCLUDE = {
  transporters: {
    select: { transporterCompanySiret: true, transporterCompanyVatNumber: true }
  },
  intermediaries: { select: { siret: true } },
  forwardedIn: {
    select: {
      recipientCompanySiret: true,
      transporters: {
        select: {
          transporterCompanySiret: true,
          transporterCompanyVatNumber: true
        }
      }
    }
  }
};

const fullInclude = { include: SIRETS_BY_ROLE_INCLUDE };

export function getFormSiretsByRole(
  form: Prisma.FormGetPayload<typeof fullInclude>
) {
  return {
    recipientsSirets: [
      form.recipientCompanySiret,
      form.forwardedIn?.recipientCompanySiret
    ].filter(Boolean),
    transportersSirets: [
      ...(form.transporters ?? []).flatMap(t => [
        t.transporterCompanySiret,
        t.transporterCompanyVatNumber
      ]),
      ...(form.forwardedIn?.transporters ?? []).flatMap(t => [
        t.transporterCompanySiret,
        t.transporterCompanyVatNumber
      ])
    ].filter(Boolean),
    intermediariesSirets:
      form.intermediaries?.map(intermediary => intermediary.siret) ?? []
  };
}

export async function getTransporters(
  form: Pick<Form, "id">
): Promise<BsddTransporter[]> {
  const transporters = await prisma.form
    .findUnique({ where: { id: form.id } })
    .transporters({ orderBy: { number: "asc" } });
  return transporters ?? [];
}

export function getTransportersSync(form: {
  transporters: BsddTransporter[] | null;
}): BsddTransporter[] {
  return (form.transporters ?? []).sort((t1, t2) => t1.number - t2.number);
}

export async function getFirstTransporter(
  form: Pick<Form, "id">
): Promise<BsddTransporter | null> {
  const transporters = await getTransporters(form);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}

export function getFirstTransporterSync(form: {
  transporters: BsddTransporter[] | null;
}): BsddTransporter | null {
  const transporters = getTransportersSync(form);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}
