import { User, Bsff } from "@prisma/client";
import { ForbiddenError } from "apollo-server-express";
import prisma from "../prisma";

export async function isBsffContributor(
  user: User,
  bsff: Partial<
    Pick<
      Bsff,
      | "emitterCompanySiret"
      | "transporterCompanySiret"
      | "destinationCompanySiret"
    >
  >
) {
  const association = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      company: {
        siret: {
          in: [
            bsff.emitterCompanySiret,
            bsff.transporterCompanySiret,
            bsff.destinationCompanySiret
          ].filter(Boolean)
        }
      }
    }
  });

  if (association == null) {
    throw new ForbiddenError(
      "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
    );
  }
}
