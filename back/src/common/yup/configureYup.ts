import * as yup from "yup";
import { AnyObject } from "yup/lib/types";

declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    requiredIf<T>(contextKey: string, message?: string): this;
  }
}

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
      return this.nullable().notRequired();
    }

    // nullable to treat null as a missing value, not a type error
    return this.nullable().required(message);
  });
}
