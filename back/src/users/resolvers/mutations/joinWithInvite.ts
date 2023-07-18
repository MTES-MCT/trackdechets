import { UserInputError } from "apollo-server-express";
import * as yup from "yup";
import { MutationResolvers } from "../../../generated/graphql/types";
import {
  acceptNewUserCompanyInvitations,
  getUserAccountHashOrNotFound,
  userExists,
  createUser
} from "../../database";
import { hashPassword } from "../../utils";

const validationSchema = yup.object({
  name: yup.string().required("Le nom est un champ requis"),
  password: yup
    .string()
    .required("Le mot de passe est un champ requis")
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
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
