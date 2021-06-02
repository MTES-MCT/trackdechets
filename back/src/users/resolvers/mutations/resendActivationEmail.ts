import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { renderMail } from "../../../mailer/templates/renderers";
import { onSignup } from "../../../mailer/templates";
import { UserInputError } from "apollo-server-express";

const resendActivationEmail: MutationResolvers["resendActivationEmail"] = async (
  parent,
  { email }
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UserInputError(`Cet email n'existe pas sur notre plateforme.`);
  }

  if (user.isActive) {
    throw new UserInputError("Ce compte a déjà été activé");
  }

  const activationHashes = await prisma.userActivationHash.findMany({
    where: { userId: user.id }
  });

  if (activationHashes?.length === 0) {
    throw new Error(
      `L'utlisateur ${user.email} non actif ne possède pas de hash d'activation`
    );
  }

  const { hash } = activationHashes[0];

  await sendMail(
    renderMail(onSignup, {
      to: [{ name: user.name, email: user.email }],
      variables: { activationHash: hash }
    })
  );

  return true;
};

export default resendActivationEmail;
