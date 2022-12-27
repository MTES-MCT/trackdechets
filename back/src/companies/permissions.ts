import {
  User,
  TraderReceipt,
  BrokerReceipt,
  WorkerCertification
} from "@prisma/client";
import prisma from "../prisma";
import { getFullUser } from "../users/database";
import { ForbiddenError } from "apollo-server-express";
import { getUserRole } from "./database";
import { VhuAgrement } from "../generated/graphql/types";
import { FullUser } from "../users/types";

async function getRole(
  companies,
  fullUser: FullUser,
  forbiddenError: ForbiddenError,
  user: User
) {
  const orgIds = companies.map(c => c.orgId);
  const found = fullUser.companies.find(c => orgIds.includes(c.orgId));
  if (!found) {
    throw forbiddenError;
  }
  const role = await getUserRole(user.id, found.orgId);
  return role;
}

export async function checkCanReadUpdateDeleteTraderReceipt(
  user: User,
  receipt: TraderReceipt
) {
  const fullUser = await getFullUser(user);

  // check associated company
  const companies = await prisma.company.findMany({
    where: { traderReceipt: { id: receipt.id } }
  });

  const forbiddenError = new ForbiddenError(
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant`
  );

  if (companies.length <= 0) {
    // No companies associated with the receipt
    throw forbiddenError;
  } else {
    const role = await getRole(companies, fullUser, forbiddenError, user);
    if (role !== "ADMIN") {
      throw forbiddenError;
    }
  }

  return true;
}

export async function checkCanReadUpdateDeleteBrokerReceipt(
  user: User,
  receipt: BrokerReceipt
) {
  const fullUser = await getFullUser(user);

  // check associated company
  const companies = await prisma.company.findMany({
    where: { brokerReceipt: { id: receipt.id } }
  });

  const forbiddenError = new ForbiddenError(
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé courtier`
  );

  if (companies.length <= 0) {
    // No companies associated with the receipt
    throw forbiddenError;
  } else {
    const role = await getRole(companies, fullUser, forbiddenError, user);
    if (role !== "ADMIN") {
      throw forbiddenError;
    }
  }

  return true;
}

export async function checkCanReadUpdateDeleteTransporterReceipt(
  user: User,
  receipt: TraderReceipt
) {
  const fullUser = await getFullUser(user);

  // check associated company
  const companies = await prisma.company.findMany({
    where: { transporterReceipt: { id: receipt.id } }
  });

  const forbiddenError = new ForbiddenError(
    `Vous n'avez pas le droit d'éditer ou supprimer ce récépissé transporteur`
  );

  if (companies.length <= 0) {
    // No companies associated with the receipt
    throw forbiddenError;
  } else {
    const role = await getRole(companies, fullUser, forbiddenError, user);
    if (role !== "ADMIN") {
      throw forbiddenError;
    }
  }

  return true;
}

export async function checkCanReadUpdateDeleteVhuAgrement(
  user: User,
  agrement: VhuAgrement
) {
  const fullUser = await getFullUser(user);

  // check associated company
  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { vhuAgrementDemolisseur: { id: agrement.id } },
        { vhuAgrementBroyeur: { id: agrement.id } }
      ]
    }
  });

  const forbiddenError = new ForbiddenError(
    `Vous n'avez pas le droit d'éditer ou supprimer cet agrément VHU`
  );

  if (companies.length <= 0) {
    // No companies associated with the agrement
    throw forbiddenError;
  } else {
    const role = await getRole(companies, fullUser, forbiddenError, user);
    if (role !== "ADMIN") {
      throw forbiddenError;
    }
  }

  return true;
}

export async function checkCanReadUpdateDeleteWorkerCertification(
  user: User,
  certification: WorkerCertification
) {
  const fullUser = await getFullUser(user);

  // check associated company
  const companies = await prisma.company.findMany({
    where: {
      workerCertificationId: certification.id
    }
  });

  const forbiddenError = new ForbiddenError(
    `Vous n'avez pas le droit d'éditer ou supprimer cette certification`
  );

  if (companies.length <= 0) {
    // No companies associated with the certification
    throw forbiddenError;
  }
  const role = await getRole(companies, fullUser, forbiddenError, user);
  if (role !== "ADMIN") {
    throw forbiddenError;
  }

  return true;
}
