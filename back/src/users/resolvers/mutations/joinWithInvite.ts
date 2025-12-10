import * as yup from "yup";
import type { MutationResolvers } from "@td/codegen-back";
import {
  acceptNewUserCompanyInvitations,
  getUserAccountHashOrNotFound,
  userExists,
  createUser
} from "../../database";
import { checkPasswordCriteria, hashPassword } from "../../utils";
import { UserInputError } from "../../../common/errors";

const validationSchema = yup.object({
  name: yup.string().required("Le nom est un champ requis").isSafeSSTI(),
  password: yup
    .string()
    .required("Vous devez saisir un mot de passe.")
    .test("new-user-password-meets-criteria", "", (password: string) => {
      checkPasswordCriteria(password);
      return true;
    })
});

const joinWithInviteResolver: MutationResolvers["joinWithInvite"] = async (
  parent,
  args
) => {
  validationSchema.validateSync(args);

  const { inviteHash, name, password } = args;

  const existingHash = await getUserAccountHashOrNotFound({ hash: inviteHash });

  if (existingHash.acceptedAt) {
    throw new UserInputError("Cette invitation a déjà été acceptée");
  }

  const exists = await userExists(existingHash.email);
  if (exists) {
    throw new UserInputError(
      "Impossible de créer cet utilisateur. Cet email a déjà un compte"
    );
  }

  const hashedPassword = await hashPassword(password);
  const user = await createUser({
    data: {
      name,
      email: existingHash.email,
      password: hashedPassword,
      phone: "",
      isActive: true,
      activatedAt: new Date()
    }
  });

  // accept all pending invitations at once
  await acceptNewUserCompanyInvitations(user);

  return {
    ...user,
    // companies are resolved through a separate resolver (User.companies)
    companies: [],
    featureFlags: []
  };
};

export default joinWithInviteResolver;
