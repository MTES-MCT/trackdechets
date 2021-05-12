import { Bsff } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffSignatureType,
  MutationResolvers,
  MutationSignBsffArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { unflattenBsff } from "../../converter";
import { getBsffOrNotFound } from "../../database";

async function checkIsAllowed(
  siret: string | null,
  user: Express.User,
  securityCode: number | null
) {
  if (siret == null) {
    throw new UserInputError(
      `Les informations relatives à l'acteur pour lequel vous souhaitez signer sont manquantes.`
    );
  }

  if (securityCode) {
    const count = await prisma.company.count({
      where: {
        siret,
        securityCode
      }
    });
    if (count <= 0) {
      throw new UserInputError(`Le code de sécurité est incorrect.`);
    }
  } else {
    const count = await prisma.companyAssociation.count({
      where: {
        userId: user.id,
        company: {
          siret
        }
      }
    });
    if (count <= 0) {
      throw new UserInputError(
        `Vous n'êtes pas autorisé à signer pour cet acteur.`
      );
    }
  }
}

const signatures: Record<
  BsffSignatureType,
  (
    args: MutationSignBsffArgs,
    user: Express.User,
    existingBsff: Bsff
  ) => Promise<Bsff>
> = {
  EMITTER: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(existingBsff.emitterCompanySiret, user, securityCode);

    if (existingBsff.emitterEmissionSignatureDate) {
      throw new Error(`L'émetteur de ce bordereau a déjà signé.`);
    }

    return prisma.bsff.update({
      data: {
        emitterEmissionSignatureDate: signature.date,
        emitterEmissionSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  },
  TRANSPORTER: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(
      existingBsff.transporterCompanySiret,
      user,
      securityCode
    );

    if (existingBsff.emitterEmissionSignatureDate == null) {
      throw new UserInputError(
        `Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau.`
      );
    }

    if (existingBsff.transporterTransportSignatureDate) {
      throw new Error(`Le transporteur de ce bordereau a déjà signé.`);
    }

    return prisma.bsff.update({
      data: {
        transporterTransportSignatureDate: signature.date,
        transporterTransportSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  }
};

const signBsff: MutationResolvers["signBsff"] = async (_, args, context) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound(args.id);
  const sign = signatures[args.type];
  const updatedBsff = await sign(args, user, existingBsff);

  return {
    ...unflattenBsff(updatedBsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default signBsff;
