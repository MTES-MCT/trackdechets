import crypto from "crypto";
import { promisify } from "util";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "../../../generated/graphql/types";
import { renderMail, createPasswordResetRequest } from "@td/mail";
import { sanitizeEmail } from "../../../utils";
import { addHours } from "date-fns";
import { checkCaptcha } from "../../../captcha/captchaGen";
import { UserInputError } from "../../../common/errors";

const createPasswordResetRequestResolver: MutationResolvers["createPasswordResetRequest"] =
  async (parent, { input }) => {
    const { email, captcha } = input;

    const user = await prisma.user.findUnique({
      where: { email: sanitizeEmail(email) }
    });

    const captchaIsValid = await checkCaptcha(captcha.value, captcha.token);

    if (!captchaIsValid) {
      throw new UserInputError("Le test anti-robots est incorrect");
    }
    if (!user) {
      // for security reason, do not leak  any clue
      return true;
    }

    // First, delete all previous password reset hashes
    await prisma.userResetPasswordHash.deleteMany({
      where: { userId: user.id }
    });

    // Then generate a new hash
    const resetHash = (await promisify(crypto.randomBytes)(20)).toString("hex");

    const hashExpires = addHours(new Date(), 4);

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
