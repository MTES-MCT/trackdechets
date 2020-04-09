import { hash } from "bcrypt";
import { sendMail } from "../../common/mails.helper";
import { User, prisma } from "../../generated/prisma-client";
import { userMails } from "../mails";
import { hashPassword } from "../utils";
import { UserInputError } from "apollo-server-express";

export default async function signup(_, { userInfos }) {
  const hashedPassword = await hashPassword(userInfos.password);
  const user = await prisma
    .createUser({
      name: userInfos.name,
      email: userInfos.email,
      password: hashedPassword,
      phone: userInfos.phone
    })
    .catch(__ => null);

  if (!user) {
    return new UserInputError(
      "Impossible de créer cet utilisateur. Cet email a déjà un compte associé ou le mot de passe est vide."
    );
  }

  const userActivationHash = await createActivationHash(user);
  await acceptNewUserCompanyInvitations(user);
  await sendMail(userMails.onSignup(user, userActivationHash.hash));

  return user;
}

/**
 * On signup we create an activation hash.
 * This hash must be validated before accessing the account.
 * This is to make sure we have a valid email.
 *
 * @param user
 */
async function createActivationHash(user: User) {
  const activationHash = await hash(
    new Date().valueOf().toString() + Math.random().toString(),
    10
  );
  return prisma
    .createUserActivationHash({
      hash: activationHash,
      user: {
        connect: { id: user.id }
      }
    })
    .catch(_ => {
      throw new Error("Erreur technique. Le support a été informé.");
    });
}

/**
 * If the user has pending invitations, validate them all at once on signup
 *
 * @param user
 */
export async function acceptNewUserCompanyInvitations(user: User) {
  const existingHashes = await prisma
    .userAccountHashes({ where: { email: user.email } })
    .catch(_ => {
      throw new Error("Technical error.");
    });

  if (!existingHashes.length) {
    return Promise.resolve();
  }

  await Promise.all(
    existingHashes.map(existingHash =>
      prisma.createCompanyAssociation({
        company: { connect: { siret: existingHash.companySiret } },
        user: { connect: { id: user.id } },
        role: existingHash.role
      })
    )
  );

  return prisma.deleteManyUserAccountHashes({
    id_in: existingHashes.map(h => h.id)
  });
}
