import {
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  isIntrospectionType,
  isObjectType
} from "graphql";
import {
  IMiddleware,
  IMiddlewareGeneratorConstructor
} from "graphql-middleware";
import { ValidationError } from "yup";
import { DomainError, ErrorCode } from "../../errors";
import { RuleFieldMap, RuleTypeMap, ValidationRule } from "./types";

function generateFieldMiddlewareFromRule(rule: ValidationRule) {
  return async function(
    resolve: Function,
    root,
    args,
    context,
    info: GraphQLResolveInfo
  ) {
    try {
      await rule.validate(args, {
        abortEarly: false
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new DomainError(
          error.errors.join("\n"),
          ErrorCode.BAD_USER_INPUT
        );
      } else {
        throw error;
      }
    }

    return resolve(root, args, context, info);
  };
}

function applyValidationRulesToType(
  type: GraphQLObjectType,
  rules: RuleFieldMap
) {
  const fieldMap = type.getFields();

  const fieldErrors = Object.keys(rules)
    .filter(type => !Object.prototype.hasOwnProperty.call(fieldMap, type))
    .map(field => `${type.name}.${field}`)
    .join(", ");

  if (fieldErrors.length > 0) {
    throw new Error(
      `Cannot apply rules to ${fieldErrors}, fields are not in your schema.`
    );
  }

  return Object.keys(fieldMap)
    .filter(field => rules[field] != null)
    .reduce(
      (middleware, field) => ({
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(rules[field])
      }),
      {}
    );
}

/**
 * Converts rule tree to middleware.
 *
 * @param schema
 * @param validationTree
 */
function generateMiddlewareFromSchemaAndValidationsTree(
  schema: GraphQLSchema,
  validationTree: RuleTypeMap
) {
  const typeMap = schema.getTypeMap();

  const typeErrors = Object.keys(validationTree)
    .filter(type => !Object.prototype.hasOwnProperty.call(typeMap, type))
    .join(", ");

  if (typeErrors.length > 0) {
    throw new Error(
      `Cannot apply rules to ${typeErrors}, types are not in your schema.`
    );
  }

  return Object.keys(typeMap)
    .filter(type => !isIntrospectionType(typeMap[type]) && validationTree[type])
    .reduce<IMiddleware>((middleware, typeName) => {
      const type = typeMap[typeName];

      if (isObjectType(type)) {
        return {
          ...middleware,
          [typeName]: applyValidationRulesToType(type, validationTree[typeName])
        };
      } else {
        return middleware;
      }
    }, {});
}

/**
 * Generates middleware from given validation rules.
 *
 * @param validationTree
 */
export function generateMiddlewareGeneratorFromRuleTree<
  TSource = any,
  TContext = any,
  TArgs = any
>(
  validationTree: RuleTypeMap
): IMiddlewareGeneratorConstructor<TSource, TContext, TArgs> {
  return (schema: GraphQLSchema) =>
    generateMiddlewareFromSchemaAndValidationsTree(schema, validationTree);
}
