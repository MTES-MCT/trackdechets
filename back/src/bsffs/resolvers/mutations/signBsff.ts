import { Bsff } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsffSignatureType,
  MutationResolvers,
  MutationSignBsffArgs
} from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  beforeEmissionSchema,
  beforeTransportSchema,
  beforeReceptionSchema,
  beforeOperationSchema
} from "../../validation";
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
  EMISSION: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(existingBsff.emitterCompanySiret, user, securityCode);
    await beforeEmissionSchema.validate(existingBsff, { abortEarly: false });

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
  TRANSPORT: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(
      existingBsff.transporterCompanySiret,
      user,
      securityCode
    );
    await beforeTransportSchema.validate(existingBsff, { abortEarly: false });

    return prisma.bsff.update({
      data: {
        transporterTransportSignatureDate: signature.date,
        transporterTransportSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  },
  RECEPTION: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(
      existingBsff.destinationCompanySiret,
      user,
      securityCode
    );
    await beforeReceptionSchema.validate(existingBsff, { abortEarly: false });

    return prisma.bsff.update({
      data: {
        destinationReceptionSignatureDate: signature.date,
        destinationReceptionSignatureAuthor: signature.author
      },
      where: {
        id
      }
    });
  },
  OPERATION: async ({ id, signature, securityCode }, user, existingBsff) => {
    await checkIsAllowed(
      existingBsff.destinationCompanySiret,
      user,
      securityCode
    );
    await beforeOperationSchema.validate(existingBsff, { abortEarly: false });

    return prisma.bsff.update({
      data: {
        destinationOperationSignatureDate: signature.date,
        destinationOperationSignatureAuthor: signature.author
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
