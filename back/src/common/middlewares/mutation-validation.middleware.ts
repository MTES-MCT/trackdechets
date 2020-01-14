import { ValidationError } from "yup";
import { GraphQLResolveInfo } from "graphql";

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

    const mutationValidationSchema = mutationDefinition["validationSchema"];
    console.log(typeof mutationValidationSchema);

    if (mutationValidationSchema) {
      try {
        await mutationValidationSchema.validate(args, {
          abortEarly: false
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return {
            error: error.message
          };
        } else {
          throw error;
        }
      }
    }

    return resolve(root, args, context, info);
  }
});
