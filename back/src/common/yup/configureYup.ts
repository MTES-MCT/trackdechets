import * as yup from "yup";

export default function configureYup() {
  yup.setLocale({
    mixed: {
      default: "${path} est invalide",
      required: "${path} est un champ requis et doit avoir une valeur",
      notType: "${path} ne peut pas être null"
    }
  });

  yup.addMethod<yup.BaseSchema>(
    yup.mixed,
    "sealedRequired",
    function sealedRequired(message?: string) {
      return this.when("$isDraft", {
        is: true,
        then: s => s.nullable().notRequired(),
        otherwise: s => s.nullable().required(message) // nullable to treat null as a missing value, not a type error
      }).transform(val => (val === "" ? null : val));
    }
  );
}
