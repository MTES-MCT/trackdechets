import { AnyObject } from "yup/lib/types";

/* eslint-disable */
declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    requiredIf<T>(condition: boolean, message?: string): this;
  }
}
/* eslint-enable */
