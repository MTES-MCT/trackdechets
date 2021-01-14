import * as yup from "yup";
import { AnyObject } from "yup/lib/types";

declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    requiredIf<T>(condition: boolean, message?: string): this;
  }
}

export type FactorySchemaOf<Context, Type> = (
  context: Context
) => yup.SchemaOf<Type>;

export default function configureYup() {
  yup.setLocale({
    mixed: {
      default: "${path} est invalide",
      required: "${path} est un champ requis et doit avoir une valeur",
      notType: "${path} ne peut pas être null"
    }
  });

  yup.addMethod<yup.BaseSchema>(yup.mixed, "requiredIf", function requiredIf(
    condition: boolean,
    message?: string
  ) {
    if (condition) {
      // nullable to treat null as a missing value, not a type error
      return this.nullable().required(message);
    }

    return this.nullable().notRequired();
  });
}
