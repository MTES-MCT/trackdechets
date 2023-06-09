import {
  User,
  TraderReceipt,
  BrokerReceipt,
  WorkerCertification
} from "@prisma/client";
import prisma from "../prisma";
import { VhuAgrement } from "../generated/graphql/types";
import { Permission, checkUserPermissions } from "../permissions";

export async function checkCanReadUpdateDeleteTraderReceipt(
  user: User,
  receipt: TraderReceipt
) {
  // check associated company
  const companies = await prisma.traderReceipt
    .findUnique({
      where: { id: receipt.id }
    })
    .Company({ select: { orgId: true } });

  const orgIds = (companies ?? []).map(c => c.orgId);

  await checkUserPermissions(
    user,
    orgIds,
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant`
  );

  return true;
}

export async function checkCanReadUpdateDeleteBrokerReceipt(
  user: User,
  receipt: BrokerReceipt
) {
  // check associated company
  const companies = await prisma.brokerReceipt
    .findUnique({
      where: { id: receipt.id }
    })
    .Company({ select: { orgId: true } });

  const orgIds = (companies ?? []).map(c => c.orgId);

  await checkUserPermissions(
    user,
    orgIds,
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé courtier`
  );

  return true;
}

export async function checkCanReadUpdateDeleteTransporterReceipt(
  user: User,
  receipt: TraderReceipt
) {
  // check associated company
  const companies = await prisma.transporterReceipt
    .findUnique({
      where: { id: receipt.id }
    })
    .Company({ select: { orgId: true } });

  const orgIds = (companies ?? []).map(c => c.orgId);

  await checkUserPermissions(
    user,
    orgIds,
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé transporteur`
  );

  return true;
}

export async function checkCanReadUpdateDeleteVhuAgrement(
  user: User,
  agrement: VhuAgrement
) {
  const { broyeurCompanies, demolisseurCompanies } =
    await prisma.vhuAgrement.findUniqueOrThrow({
      where: { id: agrement.id },
      include: {
        broyeurCompanies: { select: { orgId: true } },
        demolisseurCompanies: { select: { orgId: true } }
      }
    });

  const orgIds = [...broyeurCompanies, ...demolisseurCompanies].map(
    c => c.orgId
  );

  await checkUserPermissions(
    user,
    orgIds,
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer cet agrément VHU`
  );
  return true;
}

export async function checkCanReadUpdateDeleteWorkerCertification(
  user: User,
  certification: WorkerCertification
) {
  // check associated company
  const companies = await prisma.workerCertification
    .findUnique({
      where: { id: certification.id }
    })
    .Company({ select: { orgId: true } });

  const orgIds = (companies ?? []).map(c => c.orgId);

  await checkUserPermissions(
    user,
    orgIds,
    Permission.CompanyCanUpdate,
    `Vous n'avez pas le droit d'éditer ou supprimer cette certification`
  );

  return true;
}
