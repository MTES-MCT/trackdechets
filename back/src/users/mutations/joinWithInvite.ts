import { prisma } from "../../generated/prisma-client";
import { hashPassword } from "../utils";

export async function joinWithInvite(
  inviteHash: string,
  name: string,
  password: string
) {
  const existingHash = await prisma.userAccountHash({ hash: inviteHash });

  if (!existingHash) {
    return new Error(
      `Cette invitation n'est plus valable. Contactez le responsable de votre société.`
    );
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.createUser({
    name: name,
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
