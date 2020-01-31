import { IMiddlewareGenerator, middleware } from "graphql-middleware";
import { generateMiddlewareGeneratorFromRuleTree } from "./generator";
import { RuleTypeMap } from "./types";
import { mergeValidationRules } from "./utils";

/**
 * Middleware for validating your schema with Yup
 *
 * @param validationTree tree contqining the vvalidation rules
 *
 * eg:
 * ```
 * {
 *  Query: { aField: object({...}), otherField: object({...}) }
 *  Mutation: { aMutation: object({...}) }
 *  SubType: { aSubField: object({...}) }
 * }
 * ```
 */
function schemaValidation<TSource = any, TContext = any, TArgs = any>(
  validationTree: RuleTypeMap
): IMiddlewareGenerator<TSource, TContext, TArgs> {
  const generatorFunction = generateMiddlewareGeneratorFromRuleTree<
    TSource,
    TContext,
    TArgs
  >(validationTree);

  return middleware(generatorFunction);
}

export { schemaValidation, mergeValidationRules };
