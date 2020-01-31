import { ObjectSchema } from "yup";

export type RuleTypeMap = {
  [key: string]: RuleFieldMap;
};

export type RuleFieldMap = {
  [key: string]: ValidationRule;
};

export type ValidationRule = ObjectSchema<any>;
