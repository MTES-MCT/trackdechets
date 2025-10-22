import * as yup from "yup";
import { AnyObject } from "yup/lib/types";
import { SSTI_CHARS } from "@td/constants";
/* eslint-disable */
declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    requiredIf<T>(condition: boolean | undefined, message?: string): this;
    isSafeSSTI<T>(): this;
  }
}
/* eslint-enable */

export type FactorySchemaOf<Context, Type> = (
  context: Context
) => yup.SchemaOf<Type>;

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

  yup.addMethod<yup.BaseSchema>(
    yup.mixed,
    "requiredIf",
    function requiredIf(condition: boolean, message?: string) {
      if (condition) {
        // nullable to treat null as a missing value, not a type error
        return this.nullable().required(message);
      }

      return this.nullable().notRequired();
    }
  );

  /**
   * Validates string is safe against server-side template injections
   */
  yup.addMethod<yup.BaseSchema>(
    yup.string,
    "isSafeSSTI",
    function safeSSTIString() {
      return this.test(
        "safe-ssti",
        `Les caractères suivants sont interdits: ${SSTI_CHARS.join(" ")}`,
        function (value) {
          return !SSTI_CHARS.some(char => value?.includes(char));
        }
      );
    }
  );
}
