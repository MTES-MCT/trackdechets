import { User } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import { hash } from "bcrypt";
import prisma from "../../../prisma";
import * as yup from "yup";
import { sendMail } from "../../../mailer/mailing";
import {
  MutationResolvers,
  MutationSignupArgs
} from "../../../generated/graphql/types";
import { sanitizeEmail } from "../../../utils";
import { acceptNewUserCompanyInvitations, userExists } from "../../database";
import { userMails } from "../../mails";
import { hashPassword } from "../../utils";

export const signupSchema = yup.object({
  userInfos: yup.object({
    email: yup
      .string()
      .email("L'email saisi n'est pas conforme.")
      .required("Vous devez saisir un email."),
    password: yup
      .string()
      .required("Vous devez saisir un mot de passe.")
      .min(8, "Le mot de passe doit faire au moins 8 caractères")
  })
});

function validateArgs(args: MutationSignupArgs) {
  signupSchema.validateSync(args);
  return args;
}

export async function signupFn({
  userInfos: { name, password, phone, email: unsafeEmail }
}: MutationSignupArgs) {
  const exists = await userExists(unsafeEmail);
  if (exists) {
    throw new UserInputError(
      "Impossible de créer cet utilisateur. Cet email a déjà un compte"
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email: sanitizeEmail(unsafeEmail),
      password: hashedPassword,
      phone
    }
  });

  const userActivationHash = await createActivationHash(user);
  await acceptNewUserCompanyInvitations(user);
  await sendMail(userMails.onSignup(user, userActivationHash.hash));

  return {
    ...user,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
}

const signupResolver: MutationResolvers["signup"] = async (parent, args) => {
  const validArgs = validateArgs(args);
  return signupFn(validArgs);
};

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
  return prisma.userActivationHash.create({
    data: {
      hash: activationHash,
      user: {
        connect: { id: user.id }
      }
    }
  });
}

export default signupResolver;
