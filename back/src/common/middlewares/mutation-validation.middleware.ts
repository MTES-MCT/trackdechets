import { GraphQLResolveInfo } from "graphql";
import { ValidationError } from "yup";
import { DomainError, ErrorCode } from "../errors";

/**
 * Middleware to validate mutations with Yup
 * For every mutation, we look for a field called `getValidationSchema`.
 * This field must be a function returning a Yup schema. We validate the
 * input based on taht schema before resolving the mutation.
 *
 * eg: `{
 *   Mutation {
 *     noValidation: () => .... // mutation body
 *     validation: {
 *       getValidationSchema: object({...}) // Yup schema
 *       resolve: () => .... // mutation body
 *     }
 *   }
 * }
 */
export const mutationValidationMiddleware = () => ({
  async Mutation(
    resolve: Function,
    root,
    args,
    context,
    info: GraphQLResolveInfo
  ) {
    const mutationField = info.schema.getMutationType();
    const mutationDefinition = mutationField.getFields()[info.fieldName];

    const mutationValidationSchemaGetter =
      mutationDefinition["getValidationSchema"];

    if (mutationValidationSchemaGetter) {
      // As we merge the resolvers together, we loose yups objects prototypes
      // To avoid this problem, force using functions that resolve the schema only when called
      if (typeof mutationValidationSchemaGetter !== "function") {
        throw new Error("`getValidationSchema` must be a function");
      }

      const mutationValidationSchema = mutationValidationSchemaGetter();

      try {
        await mutationValidationSchema.validate(args, {
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
    }

    return resolve(root, args, context, info);
  }
});
