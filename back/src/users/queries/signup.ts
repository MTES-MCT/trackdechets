import { hash } from "bcrypt";
import { DomainError, ErrorCode } from "../../common/errors";
import { sendMail } from "../../common/mails.helper";
import { Prisma, User } from "../../generated/prisma-client";
import { GraphQLContext } from "../../types";
import { userMails } from "../mails";
import { hashPassword } from "../utils";

export default async function signup(_, { userInfos }, context: GraphQLContext) {
  const hashedPassword = await hashPassword(userInfos.password);
  const user = await context.prisma
    .createUser({
      name: userInfos.name,
      email: userInfos.email,
      password: hashedPassword,
      phone: userInfos.phone
    })
    .catch(async _ => {
      throw new DomainError(
        "Impossible de créer cet utilisateur. Cet email a déjà un compte associé ou le mot de passe est vide.",
        ErrorCode.BAD_USER_INPUT
      );
    });

  const userActivationHash = await createActivationHash(user, context.prisma);
  await acceptNewUserComapnyInvitations(user, context.prisma);
  await sendMail(userMails.onSignup(user, userActivationHash.hash));

  return user;
}

/**
 * On signup we create an activation hash.
 * This hash must be validated before accessing the account.
 * This is to make sure we have a valid email.
 *
 * @param user
 * @param prisma
 */
async function createActivationHash(user: User, prisma: Prisma) {
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
 * @param prisma
 */
async function acceptNewUserComapnyInvitations(user: User, prisma: Prisma) {
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
