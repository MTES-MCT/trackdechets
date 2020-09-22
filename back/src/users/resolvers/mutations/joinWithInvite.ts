import { prisma } from "../../../generated/prisma-client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { hashPassword } from "../../utils";
import { getUserAccountHashOrNotFound } from "../../database";
import { UserInputError } from "apollo-server-express";

const joinWithInviteResolver: MutationResolvers["joinWithInvite"] = async (
  parent,
  { inviteHash, name, password }
) => {
  const existingHash = await getUserAccountHashOrNotFound({ hash: inviteHash });

  if (existingHash.joined) {
    throw new UserInputError(
      `Le compte de l'utilisateur ${existingHash.email} a déjà été crée`
    );
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.createUser({
    name,
    email: existingHash.email,
    password: hashedPassword,
    phone: "",
    isActive: true,
    companyAssociations: {
      create: {
        company: { connect: { siret: existingHash.companySiret } },
        role: existingHash.role
      }
    }
  });

  // persist

  await prisma
    .deleteUserAccountHash({ hash: inviteHash })
    .catch(err =>
      console.error(`Cannot delete user account hash ${inviteHash}`, err)
    );

  return user;
};

export default joinWithInviteResolver;
