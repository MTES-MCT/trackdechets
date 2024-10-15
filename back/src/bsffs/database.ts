import {
  BsffFicheIntervention as PrismaBsffFicheIntervention,
  BsffPackaging,
  BsffPackagingType,
  BsffType,
  Prisma,
  BsffTransporter,
  Bsff
} from "@prisma/client";
import {
  BsffFicheIntervention,
  BsffInput,
  BsffPackagingInput
} from "../generated/graphql/types";
import {
  expandBsffFromDB,
  expandFicheInterventionBsffFromDB
} from "./converter";
import { GraphQLContext } from "../types";
import { checkCanCreate, checkCanUpdateFicheIntervention } from "./permissions";
import {
  getBsffRepository,
  getReadonlyBsffFicheInterventionRepository,
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "./repository";
import { Permission, can, getUserRoles } from "../permissions";
import { ForbiddenError, UserInputError } from "../common/errors";
import { prisma } from "@td/prisma";
import {
  BsffWithFicheInterventionInclude,
  BsffWithFicheInterventions,
  BsffWithTransporters,
  BsffWithTransportersInclude
} from "./types";
import { graphQlInputToZodBsff } from "./validation/bsff/helpers";
import { parseBsffAsync } from "./validation/bsff";
import { PrismaTransaction } from "../common/repository/types";

export async function getBsffOrNotFound(where: Prisma.BsffWhereUniqueInput) {
  const { findUnique } = getReadonlyBsffRepository();
  const bsff = await findUnique({
    where,
    include: {
      ...BsffWithTransportersInclude,
      ...BsffWithFicheInterventionInclude,
      packagings: { include: { previousPackagings: true } }
    }
  });

  if (bsff == null) {
    throw new UserInputError(`Le BSFF n°${where.id} n'existe pas.`);
  }

  return bsff;
}

export async function getBsffPackagingOrNotFound(
  where: Prisma.BsffPackagingWhereUniqueInput
) {
  const { findUnique } = getReadonlyBsffPackagingRepository();

  const bsffpackaging = await findUnique({
    where,
    include: { bsff: { include: BsffWithTransportersInclude } }
  });

  if (bsffpackaging == null) {
    throw new UserInputError(
      `Le contenant de fluide dont l'identifiant Trackdéchets est ${where.id} n'existe pas.`
    );
  }

  return bsffpackaging;
}

export async function getFicheInterventionBsffOrNotFound(
  where: Prisma.BsffFicheInterventionWhereUniqueInput
): Promise<PrismaBsffFicheIntervention> {
  const { findUnique } = getReadonlyBsffFicheInterventionRepository();
  const ficheIntervention = await findUnique({
    where
  });
  if (ficheIntervention == null) {
    throw new UserInputError(
      `La fiche d'intervention n°${where.id} n'existe pas.`
    );
  }
  return ficheIntervention;
}

export async function getBsffTransporterOrNotFound({ id }: { id: string }) {
  if (!id) {
    throw new UserInputError(
      "Vous devez préciser un identifiant de transporteur"
    );
  }

  const transporter = await prisma.bsffTransporter.findUnique({
    where: { id }
  });

  if (transporter === null) {
    throw new UserInputError(
      `Le transporteur BSFF avec l'identifiant "${id}" n'existe pas.`
    );
  }

  return transporter;
}

/**
 * Return the "ficheInterventions" of a bsff, hiding some fields depending
 * on the user reading it
 * @param param0
 */
export async function getFicheInterventions({
  bsff,
  context: { user }
}: {
  bsff: BsffWithTransporters;
  context: GraphQLContext;
}): Promise<BsffFicheIntervention[]> {
  if (!user) {
    throw new Error("The user should have been set to enter this path.");
  }
  const { findUniqueGetFicheInterventions } = getReadonlyBsffRepository();

  const ficheInterventions =
    (await findUniqueGetFicheInterventions({
      where: { id: bsff.id }
    })) ?? [];

  const userRoles = await getUserRoles(user.id);

  const isBsffReader = [
    bsff.emitterCompanySiret,
    ...bsff.transporters.flatMap(t => [
      t.transporterCompanySiret,
      t.transporterCompanyVatNumber
    ]),
    bsff.destinationCompanySiret
  ]
    .filter(Boolean)
    .some(
      orgId =>
        orgId &&
        userRoles[orgId] &&
        can(userRoles[orgId], Permission.BsdCanRead)
    );

  const isDetenteur = bsff.detenteurCompanySirets.some(
    siret => userRoles[siret] && can(userRoles[siret], Permission.BsdCanRead)
  );

  const expandedFicheInterventions = ficheInterventions.map(
    expandFicheInterventionBsffFromDB
  );

  if (isBsffReader) {
    return expandedFicheInterventions;
  }

  if (isDetenteur) {
    // only return detenteur's fiche d'intervention
    return expandedFicheInterventions.filter(fi => {
      const detenteurCompanySiret = fi.detenteur?.company?.siret;
      if (!detenteurCompanySiret) return false;
      return (
        userRoles[detenteurCompanySiret] &&
        can(userRoles[detenteurCompanySiret], Permission.BsdCanRead)
      );
    });
  }

  throw new ForbiddenError(
    "Vous n'êtes pas autorisé à consulter les fiches d'interventions de ce BSFF"
  );
}

/**
 * Permet de mettre à jour le champ dénormalisé `transportersOrgIds`
 */
export async function updateTransporterOrgIds(
  bsff: BsffWithTransporters,
  transaction: PrismaTransaction
) {
  const transporters = getTransportersSync(bsff);
  await transaction.bsff.update({
    where: { id: bsff.id },
    data: {
      transportersOrgIds: transporters
        .flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ])
        .filter(Boolean)
    }
  });
}

/**
 * Permet de mettre à jour le champ dénormalisé `detenteurCompanySirets`
 */
export async function updateDetenteurCompanySirets(
  bsff: BsffWithFicheInterventions,
  transaction: PrismaTransaction
) {
  await transaction.bsff.update({
    where: { id: bsff.id },
    data: {
      detenteurCompanySirets: bsff.ficheInterventions
        .map(fi => fi.detenteurCompanySiret)
        .filter(Boolean)
    }
  });
}

export async function createBsff(
  user: Express.User,
  input: BsffInput,
  { isDraft } = { isDraft: false }
) {
  await checkCanCreate(user, input);

  const { findMany: findManyFicheInterventions } =
    getReadonlyBsffFicheInterventionRepository();

  const ficheInterventions =
    input.ficheInterventions && input.ficheInterventions.length > 0
      ? await findManyFicheInterventions({
          where: { id: { in: input.ficheInterventions } }
        })
      : [];

  for (const ficheIntervention of ficheInterventions) {
    await checkCanUpdateFicheIntervention(user, ficheIntervention);
  }

  if (!input.type) {
    // Même si une valeur par défaut est fournie dans le schéma Zod pour
    // réconcilier le schéma GraphQL (qui permet de ne pas saisir de `type` ou un type null)
    // et le schéma prisma (dans lequel `type` est un champ requis), on lève ici
    // une erreur pour forcer l'utilisateur à saisir le type de bordereau de façon explicite.
    throw new UserInputError("Vous devez renseigner le type de bordereau");
  }

  const zodBsff = await graphQlInputToZodBsff(input);

  const { packagings, createdAt, ...parsedZodBsff } = await parseBsffAsync(
    { ...zodBsff, isDraft, createdAt: new Date() },
    {
      user,
      currentSignatureType: !isDraft ? "EMISSION" : undefined
    }
  );

  let transporters:
    | Prisma.BsffTransporterCreateNestedManyWithoutBsffInput
    | undefined = undefined;

  if (input.transporter) {
    transporters = {
      createMany: {
        // un seul transporteur dans le tableau normalement
        data: parsedZodBsff.transporters!.map((t, idx) => {
          const { id, bsffId, ...data } = t;
          return { ...data, number: idx + 1 };
        })
      }
    };
  } else if (input.transporters && input.transporters.length > 0) {
    transporters = {
      connect: parsedZodBsff.transporters?.map(t => ({ id: t.id! }))
    };
  }

  const data: Prisma.BsffCreateInput = {
    ...parsedZodBsff,
    ...(packagings
      ? {
          packagings: {
            create: packagings.map(packaging => {
              const { id, previousPackagings, ...packagingData } = packaging;
              return {
                ...packagingData,
                previousPackagings: {
                  connect: (previousPackagings ?? []).map(id => ({ id }))
                }
              };
            })
          }
        }
      : {}),
    ficheInterventions: {
      connect: ficheInterventions.map(fi => ({ id: fi.id }))
    },
    transporters
  };

  const bsffRepository = getBsffRepository(user);
  const bsff = await bsffRepository.create({
    data,
    include: BsffWithTransportersInclude
  });

  return expandBsffFromDB(bsff);
}

export function getPackagingCreateInput(
  bsff: Partial<Bsff | Omit<Prisma.BsffCreateInput, "transporters">> & {
    packagings?: (BsffPackagingInput & { type: BsffPackagingType })[];
  },
  previousPackagings: BsffPackaging[]
): Prisma.BsffPackagingCreateWithoutBsffInput[] {
  return [BsffType.GROUPEMENT, BsffType.REEXPEDITION].includes(bsff.type as any)
    ? // auto complete packagings based on inital packages in case of groupement or réexpédition,
      // overwriting user provided data if necessary.
      previousPackagings.map(p => ({
        type: p.type,
        other: p.other,
        numero: p.numero,
        emissionNumero: p.numero,
        volume: p.volume,
        weight: p.acceptationWeight ?? 0,
        previousPackagings: { connect: { id: p.id } }
      }))
    : bsff.type === BsffType.RECONDITIONNEMENT &&
      bsff.packagings &&
      bsff.packagings.length > 0
    ? [
        {
          type: bsff.packagings[0].type,
          other: bsff.packagings[0].other,
          volume: bsff.packagings[0].volume,
          numero: bsff.packagings[0].numero,
          emissionNumero: bsff.packagings[0].numero,
          weight: bsff.packagings[0].weight,
          previousPackagings: {
            connect: previousPackagings.map(p => ({ id: p.id }))
          }
        }
      ]
    : bsff.packagings?.map(p => ({ ...p, emissionNumero: p.numero })) ?? [];
}

export async function getTransporters(
  bsff: Pick<BsffWithTransporters, "id">
): Promise<BsffTransporter[]> {
  const transporters = await prisma.bsffTransporter.findMany({
    orderBy: { number: "asc" },
    where: { bsffId: bsff.id }
  });
  return transporters ?? [];
}

export function getTransportersSync(bsff: {
  transporters: BsffTransporter[] | null;
}): BsffTransporter[] {
  return (bsff.transporters ?? []).sort((t1, t2) => t1.number - t2.number);
}

export async function getFirstTransporter(
  bsff: Pick<BsffWithTransporters, "id">
): Promise<BsffTransporter | null> {
  const transporters = await prisma.bsffTransporter.findMany({
    where: { number: 1, bsffId: bsff.id }
  });
  if (transporters && transporters.length > 0) {
    return transporters[0];
  }
  return null;
}

export function getFirstTransporterSync(bsff: {
  transporters: BsffTransporter[] | null;
}): BsffTransporter | null {
  const transporters = getTransportersSync(bsff);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}

export function getLastTransporterSync(bsff: {
  transporters: BsffTransporter[] | null;
}): BsffTransporter | null {
  const transporters = getTransportersSync(bsff);
  const greatestNumber = Math.max(...transporters.map(t => t.number));
  const lastTransporter = transporters.find(t => t.number === greatestNumber);
  return lastTransporter ?? null;
}

export function getNthTransporterSync(
  bsff: BsffWithTransporters,
  n: number
): BsffTransporter | null {
  return (bsff.transporters ?? []).find(t => t.number === n) ?? null;
}

// Renvoie le premier transporteur qui n'a pas encore signé
export function getNextTransporterSync(bsff: {
  transporters: BsffTransporter[] | null;
}): BsffTransporter | null {
  const transporters = getTransportersSync(bsff);
  const nextTransporter = transporters.find(
    t => !t.transporterTransportSignatureDate
  );
  return nextTransporter ?? null;
}
