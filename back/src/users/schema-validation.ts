import { object, string } from "yup";

export default {
  Mutation: {
    signup: object({
      userInfos: object({
        email: string()
          .email("L'email saisi n'est pas conforme.")
          .required("Vous devez saisir un email."),
        password: string()
          .required("Vous devez saisir un mot de passe.")
          .min(8, "Le mot de passe doit faire au moins 8 caractères"),
        name: string().required("Vous devez saisir un nom et prénom."),
        phone: string().nullable()
      })
    })
  }
};
