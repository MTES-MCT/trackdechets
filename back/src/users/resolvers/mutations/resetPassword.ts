import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { generatePassword, hashPassword } from "../../utils";
import { sendMail } from "../../../mailer/mailing";
import { userMails } from "../../mails";

const resetPasswordResolver: MutationResolvers["resetPassword"] = async (
  parent,
  { email }
) => {
  const user = await prisma.user({ email });
  if (!user) {
    throw new Error(`Cet email n'existe pas sur notre plateforme.`);
  }
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  await prisma.updateUser({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  await sendMail(userMails.resetPassword(user.email, user.name, newPassword));
  return true;
};

export default resetPasswordResolver;
