import crypto from "crypto";
import { promisify } from "util";
import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { renderMail } from "../../../mailer/templates/renderers";
import { createPasswordResetRequest } from "../../../mailer/templates";
import { UserInputError } from "apollo-server-express";
import { sanitizeEmail } from "../../../utils";
import { addHours } from "date-fns";

const createPasswordResetRequestResolver: MutationResolvers["createPasswordResetRequest"] =
  async (parent, { email }) => {
    const user = await prisma.user.findUnique({
      where: { email: sanitizeEmail(email) }
    });
    if (!user) {
      throw new UserInputError(`Cet email n'existe pas sur notre plateforme.`);
    }
    const resetHash = (await promisify(crypto.randomBytes)(20)).toString("hex");

    const hashExpires = addHours(new Date(), 1);

    await prisma.userResetPasswordHash.create({
      data: {
        hash: resetHash,
        hashExpires,
        user: { connect: { id: user.id } }
      }
    });

    const mail = renderMail(createPasswordResetRequest, {
      to: [{ email: user.email, name: user.name }],
      variables: {
        resetHash
      }
    });

    await sendMail(mail);
    return true;
  };

export default createPasswordResetRequestResolver;
