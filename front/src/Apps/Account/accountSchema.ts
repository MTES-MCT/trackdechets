import { z } from "@td/validation";
import { SSTI_CHARS } from "@td/constants";
import { validatePhoneNumber } from "../../common/helper";

export const validationAccountParametersSchema = z.object({
  name: z.string().superRefine((username, context) => {
    if (!username) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Merci de renseigner un prénom et un nom"
      });
    }
    if (SSTI_CHARS.some(char => username?.includes(char))) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Les caractères suivants sont interdits: ${SSTI_CHARS.join(
          " "
        )} `
      });
    }
  }),
  email: z.string(),
  phone: z.string().superRefine((userphone, context) => {
    if (!userphone || !validatePhoneNumber(userphone)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Merci de renseigner un numéro de téléphone valide"
      });
    }
  })
});

export const validationAccountPasswordSchema = z.object({
  oldPassword: z.string().min(3, "Champ requis"),
  newPassword: z.string()
});
