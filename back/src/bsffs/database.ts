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
import getReadableId, { ReadableIdPrefix } from "../forms/readableId";
import {
  flattenBsffInput,
  expandBsffFromDB,
  expandFicheInterventionBsffFromDB,
  flattenBsffTransporterInput
} from "./converter";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "./validation";
import { GraphQLContext } from "../types";
import { toBsffPackagingWithType } from "./compat";
import { checkCanCreate, checkCanUpdateFicheIntervention } from "./permissions";
import {
  getBsffRepository,
  getReadonlyBsffFicheInterventionRepository,
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "./repository";
import { sirenifyBsffInput } from "./sirenify";
import { Permission, can, getUserRoles } from "../permissions";
import { recipify } from "./recipify";
import { ForbiddenError, UserInputError } from "../common/errors";
import { prisma } from "@td/prisma";
import {
  BsffWithFicheInterventionInclude,
  BsffWithPackagingsInclude,
  BsffWithTransporters,
  BsffWithTransportersInclude
} from "./types";

export async function getBsffOrNotFound(where: Prisma.BsffWhereUniqueInput) {
  const { findUnique } = getReadonlyBsffRepository();
  const bsff = await findUnique({
    where,
    include: {
      ...BsffWithTransportersInclude,
      ...BsffWithPackagingsInclude,
      ...BsffWithFicheInterventionInclude
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

  const transporter = getFirstTransporterSync(bsff);

  const isBsffReader = [
    bsff.emitterCompanySiret,
    transporter?.transporterCompanySiret,
    transporter?.transporterCompanyVatNumber,
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

export async function createBsff(
  user: Express.User,
  input: BsffInput,
  { isDraft } = { isDraft: false }
) {
  await checkCanCreate(user, input);

  const sirenifiedInput = await sirenifyBsffInput(input, user);
  const autocompletedInput = await recipify(sirenifiedInput);

  const flatInput: Prisma.BsffCreateInput = {
    id: getReadableId(ReadableIdPrefix.FF),
    isDraft,
    ...flattenBsffInput(autocompletedInput)
  };

  const flatTransporterInput = flattenBsffTransporterInput(input);

  if (!input.type) {
    throw new UserInputError("Vous devez préciser le type de BSFF");
  }

  const { findMany: findManyFicheInterventions } =
    getReadonlyBsffFicheInterventionRepository();

  const ficheInterventions =
    input.ficheInterventions && input.ficheInterventions.length > 0
      ? await findManyFicheInterventions({
          where: { id: { in: input.ficheInterventions } }
        })
      : [];

  const packagingsInput = input.packagings?.map(toBsffPackagingWithType);
  for (const ficheIntervention of ficheInterventions) {
    await checkCanUpdateFicheIntervention(user, ficheIntervention);
  }

  const futureBsff = {
    ...flatInput,
    packagings: packagingsInput,
    transporters: [flatTransporterInput]
  };

  await validateBsff(futureBsff, {
    isDraft,
    transporterSignature: false
  });
  await validateFicheInterventions(futureBsff, ficheInterventions);
  const { forwarding, grouping, repackaging } = input;

  const previousPackagings = await validatePreviousPackagings(futureBsff, {
    forwarding,
    grouping,
    repackaging
  });

  const packagings = getPackagingCreateInput(futureBsff, previousPackagings);

  const data: Prisma.BsffCreateInput = {
    ...flatInput,
    packagings: { create: packagings },
    // On crée un premier transporteur par défaut (même si tous les champs sont nuls)
    // Cela permet dans un premier temps d'être raccord avec le modèle "à plat"
    // en attendant l'implémentation du multi-modal
    transporters: {
      create: { ...flatTransporterInput, number: 1 }
    }
  };

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      connect: ficheInterventions.map(({ id }) => ({ id }))
    };
    data.detenteurCompanySirets = ficheInterventions
      .map(fi => fi.detenteurCompanySiret)
      .filter(Boolean);
  }

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
  const transporters = await prisma.bsff
    .findUnique({ where: { id: bsff.id } })
    .transporters({ orderBy: { number: "asc" } });
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
  const transporters = await prisma.bsff
    .findUnique({ where: { id: bsff.id } })
    .transporters({ where: { number: 1 } });
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
