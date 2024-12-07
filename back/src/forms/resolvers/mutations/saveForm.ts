import { MutationResolvers } from "@td/codegen-back";
import updateForm from "./updateForm";
import createForm from "./createForm";

const saveFormResolver: MutationResolvers["saveForm"] = (
  parent,
  { formInput },
  context
) => {
  const { id, ...input } = formInput;

  if (id) {
    return updateForm(
      parent,
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
    parent,
    {
      createFormInput: input
    },
    context
  );
};

export default saveFormResolver;
