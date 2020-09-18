import * as yup from "yup";

export default function configureYup() {
  yup.setLocale({
    mixed: {
      default: "${path} est invalide",
      required: "${path} est un champ requis et doit avoir une valeur",
      notType: "${path} ne peut pas être null"
    }
  } as yup.LocaleObject);
}
