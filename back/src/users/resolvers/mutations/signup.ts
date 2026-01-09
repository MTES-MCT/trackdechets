import { User } from "@td/prisma";
import { hash } from "bcrypt";
import { prisma } from "@td/prisma";
import * as yup from "yup";
import { sendMail } from "../../../mailer/mailing";
import type { MutationResolvers, MutationSignupArgs } from "@td/codegen-back";
import { sanitizeEmail } from "../../../utils";
import { acceptNewUserCompanyInvitations, createUser } from "../../database";
import { hashPassword, checkPasswordCriteria } from "../../utils";
import { onSignup, onSignupExistingUser, renderMail } from "@td/mail";

function validateArgs(args: MutationSignupArgs) {
  const signupSchema = yup.object({
    userInfos: yup.object({
      name: yup
        .string()
        .isSafeSSTI()
        .required("Vous devez saisir nom et prénom.")
        .test(
          "at-least-2-letters",
          "Le nom doit contenir au moins 2 lettres.",
          value => {
            if (!value) return false;
            const trimmed = value.trim();
            // Count letters (unicode)
            const letterCount = (trimmed.match(/[\p{L}]/gu) || []).length;
            return letterCount >= 2;
          }
        ),
      email: yup
        .string()
        .email("L'email saisi n'est pas conforme.")
        .required("Vous devez saisir un email."),
      password: yup
        .string()
        .required("Vous devez saisir un mot de passe.")
        .test("new-user-password-meets-criteria", "", (password: string) => {
          checkPasswordCriteria(password);
          return true;
        })
    })
  });
  signupSchema.validateSync(args);
  return args;
}

export async function signupFn({
  userInfos: { name, password, phone, email: unsafeEmail }
}: MutationSignupArgs) {
  // add a random delay to avoid leaking the existence of an account
  // by timing attacks
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  const existingUser = await prisma.user.findUnique({
    where: { email: sanitizeEmail(unsafeEmail) }
  });
  if (existingUser) {
    await sendMail(
      renderMail(onSignupExistingUser, {
        to: [{ name: existingUser.name, email: existingUser.email }]
      })
    );
    return true;
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    data: {
      name,
      email: sanitizeEmail(unsafeEmail),
      password: hashedPassword,
      phone
    }
  });

  const userActivationHash = await createActivationHash(user);
  await acceptNewUserCompanyInvitations(user);

  await sendMail(
    renderMail(onSignup, {
      to: [{ name: user.name, email: user.email }],
      variables: { activationHash: userActivationHash.hash }
    })
  );

  return true;
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
export async function createActivationHash(user: User) {
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
