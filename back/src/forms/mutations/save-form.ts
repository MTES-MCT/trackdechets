import {
  MutationSaveFormArgs,
  Form,
  ResolversParentTypes
} from "../../generated/graphql/types";
import { GraphQLContext } from "../../types";
import { updateForm } from "./updateForm";
import { createForm } from "./createForm";

export async function saveForm(
  _: ResolversParentTypes["Mutation"],
  { formInput }: MutationSaveFormArgs,
  context: GraphQLContext
): Promise<Form> {
  const { id, ...input } = formInput;

  if (id) {
    return updateForm(
      _,
      {
        updateFormInput: {
          id,
          ...input
        }
      },
      context
    );
  }

  return createForm(
    _,
    {
      createFormInput: input
    },
    context
  );
}
