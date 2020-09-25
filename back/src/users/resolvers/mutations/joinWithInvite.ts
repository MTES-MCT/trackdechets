import { prisma } from "../../../generated/prisma-client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { hashPassword } from "../../utils";
import {
  acceptNewUserCompanyInvitations,
  getUserAccountHashOrNotFound,
  userExists
} from "../../database";
import { UserInputError } from "apollo-server-express";

const joinWithInviteResolver: MutationResolvers["joinWithInvite"] = async (
  parent,
  { inviteHash, name, password }
) => {
  const existingHash = await getUserAccountHashOrNotFound({ hash: inviteHash });

  if (existingHash.acceptedAt) {
    throw new UserInputError("Cette invitation a déjà été acceptée");
  }

  const exists = await userExists(existingHash.email);
  if (exists) {
    throw new UserInputError(
      "Impossible de créer cet utilisateur. Cet email a déjà un compte"
    );
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.createUser({
    name,
    email: existingHash.email,
    password: hashedPassword,
    phone: "",
    isActive: true
  });

  // accept all pending invitations at once
  await acceptNewUserCompanyInvitations(user);

  return user;
};

export default joinWithInviteResolver;
