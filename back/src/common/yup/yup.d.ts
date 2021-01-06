import { AnyObject } from "yup/lib/types";

declare module "yup" {
  interface BaseSchema<TCast = any, TContext = AnyObject, TOutput = any> {
    sealedRequired<T>(message?: string): this;
  }
}
