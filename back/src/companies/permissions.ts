import { User, TraderReceipt, BrokerReceipt } from "@prisma/client";
import prisma from "../prisma";
import { getFullUser } from "../users/database";
import { ForbiddenError } from "apollo-server-express";
import { getUserRole } from "./database";
import { VhuAgrement } from "../generated/graphql/types";

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
    const sirets = companies.map(c => c.siret);
    const found = fullUser.companies.find(c => sirets.includes(c.siret));
    if (!found) {
      throw forbiddenError;
    }
    const role = await getUserRole(user.id, found.siret);
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
    const sirets = companies.map(c => c.siret);
    const found = fullUser.companies.find(c => sirets.includes(c.siret));
    if (!found) {
      throw forbiddenError;
    }
    const role = await getUserRole(user.id, found.siret);
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
    const sirets = companies.map(c => c.siret);
    const found = fullUser.companies.find(c => sirets.includes(c.siret));
    if (!found) {
      throw forbiddenError;
    }
    const role = await getUserRole(user.id, found.siret);
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
    const sirets = companies.map(c => c.siret);
    const found = fullUser.companies.find(c => sirets.includes(c.siret));
    if (!found) {
      throw forbiddenError;
    }
    const role = await getUserRole(user.id, found.siret);
    if (role !== "ADMIN") {
      throw forbiddenError;
    }
  }

  return true;
}
