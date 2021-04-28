import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { generatePassword, hashPassword } from "../../utils";
import { renderMail } from "../../../mailer/templates/renderers";
import { resetPassword } from "../../../mailer/templates";

const resetPasswordResolver: MutationResolvers["resetPassword"] = async (
  parent,
  { email }
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`Cet email n'existe pas sur notre plateforme.`);
  }
  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
  const mail = renderMail(resetPassword, {
    to: [{ email: user.email, name: user.name }],
    variables: { password: newPassword }
  });
  await sendMail(mail);
  return true;
};

export default resetPasswordResolver;
