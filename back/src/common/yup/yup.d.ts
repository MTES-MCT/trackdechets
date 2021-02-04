import { AnyObject } from "yup/lib/types";

declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    requiredIf<T>(condition: boolean, message?: string): this;
  }
}
