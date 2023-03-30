import * as yup from "yup";
import { SSTI_CHARS } from "../constants";

declare module "yup" {
  interface Schema<TType, TContext, TDefault, TFlags> {
    requiredIf(condition: boolean, message?: string): this;
    isSafeSSTI(): this;
  }
}

export type FactorySchemaOf<Context, Type> = (
  context: Context
) => yup.ObjectSchema<Type>;

export default function configureYup() {
  yup.setLocale({
    mixed: {
      default: "${path} est invalide",
      required: "${path} est un champ requis et doit avoir une valeur",
      notType: "${path} ne peut pas être null",
      oneOf: "${path} doit prendre l'une des valeurs suivantes: ${values}",
      defined: "${path} doit avoir une valeur"
    },
    object: {
      noUnknown: "Le champ ${path} a des valeurs invalides: ${unknown}"
    }
  });

  const types = [
    yup.mixed,
    yup.string,
    yup.number,
    yup.object,
    yup.boolean,
    yup.date,
    yup.array
  ] as const;
  for (const type of types) {
    yup.addMethod(
      type as (...args: any) => yup.Schema<any>,
      "requiredIf",
      function requiredIf(condition: boolean, message?: string) {
        if (condition) {
          // nullable to treat null as a missing value, not a type error
          return this.nullable().required(message);
        }

        return this.nullable().notRequired();
      }
    );
  }

  /**
   * Validates string is safe against server-side template injections
   */
  yup.addMethod(yup.string, "isSafeSSTI", function safeSSSTIString() {
    return this.test(
      "safe-ssti",
      `Les caractères suivants sont interdits: ${SSTI_CHARS.join(" ")}`,
      function (value) {
        return !SSTI_CHARS.some(char => value?.includes(char));
      }
    );
  });
}
