import prisma from "src/prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { userMails } from "../../mails";
import { generatePassword, hashPassword } from "../../utils";

const resetPasswordResolver: MutationResolvers["resetPassword"] = async (
  parent,
  { email }
) => {
  const user = await prisma.user.findOne({ where: { email } });
  if (!user) {
    throw new Error(`Cet email n'existe pas sur notre plateforme.`);
  }
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  await sendMail(userMails.resetPassword(user.email, user.name, newPassword));
  return true;
};

export default resetPasswordResolver;
