import crypto from "crypto";
import { promisify } from "util";
import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { generatePassword, hashPassword } from "../../utils";
import { renderMail } from "../../../mailer/templates/renderers";
import { resetPassword } from "../../../mailer/templates";
import { UserInputError } from "apollo-server-express";
import { sanitizeEmail } from "../../../utils";

const resetPasswordResolver: MutationResolvers["resetPassword"] = async (
  parent,
  { email }
) => {
  const user = await prisma.user.findUnique({
    where: { email: sanitizeEmail(email) }
  });
  if (!user) {
    throw new UserInputError(`Cet email n'existe pas sur notre plateforme.`);
  }
  const hash = (await promisify(crypto.randomBytes)(20)).toString("hex");
  const hashExpires = new Date(Date.now() + 3600000);
  await prisma.userResetPasswordHash.create({
    data: {
      hash,
      hashExpires,
      user: { connect: { id: user.id } }
    }
  });
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  const mail = renderMail(resetPassword, {
    to: [{ email: user.email, name: user.name }],
    variables: {
      hash,
      hashExpires
    }
  });
  await sendMail(mail);
  return true;
};

export default resetPasswordResolver;
