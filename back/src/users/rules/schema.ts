import { inputRule } from "graphql-shield";

export const signupSchema = inputRule()(yup =>
  yup.object({
    userInfos: yup.object({
      email: yup
        .string()
        .email("L'email saisi n'est pas conforme.")
        .required("Vous devez saisir un email."),
      password: yup
        .string()
        .required("Vous devez saisir un mot de passe.")
        .min(8, "Le mot de passe doit faire au moins 8 caractères"),
      name: yup.string().required("Vous devez saisir un nom et prénom."),
      phone: yup.string().nullable()
    })
  })
);
