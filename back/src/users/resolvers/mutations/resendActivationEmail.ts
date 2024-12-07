import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import { MutationResolvers } from "@td/codegen-back";
import { onSignup, renderMail } from "@td/mail";
import { object, string } from "yup";
import { checkCaptcha } from "../../../captcha/captchaGen";
import { UserInputError } from "../../../common/errors";

const resendActivationEmail: MutationResolvers["resendActivationEmail"] =
  async (parent, { input }) => {
    const schema = object({
      email: string()
        .email("Cet email n'est pas correctement formatté")
        .required()
    });

    const { email, captcha } = input;
    await schema.validate({ email });

    const captchaIsValid = await checkCaptcha(captcha.value, captcha.token);

    if (!captchaIsValid) {
      throw new UserInputError("Le test anti-robots est incorrect");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // for security reason, do not leak  any clue
      return true;
    }

    if (user.isActive) {
      // for security reason, do not leak  any clue
      return true;
    }

    const activationHashes = await prisma.userActivationHash.findMany({
      where: { userId: user.id }
    });

    if (activationHashes?.length === 0) {
      // for security reason, do not leak  any clue

      return true;
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
