import { prisma } from "../../generated/prisma-client";
import {
  MutationJoinWithInviteArgs,
  User
} from "../../generated/graphql/types";
import { hashPassword } from "../utils";

export async function joinWithInvite({
  inviteHash,
  name,
  password
}: MutationJoinWithInviteArgs): Promise<User> {
  const existingHash = await prisma.userAccountHash({ hash: inviteHash });

  if (!existingHash) {
    throw new Error(
      `Cette invitation n'est plus valable. Contactez le responsable de votre société.`
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

  await prisma
    .deleteUserAccountHash({ hash: inviteHash })
    .catch(err =>
      console.error(`Cannot delete user account hash ${inviteHash}`, err)
    );

  return user;
}
