import { FormResolvers } from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../converter";

const groupedInResolver: FormResolvers["groupedIn"] = async (
  form,
  _,
  { dataloaders }
) => {
  const groupements = await dataloaders.initialFormGoupements.load(form.id);
  const nextFormIds = groupements.map(g => g.nextFormId);
  const nextForms = await Promise.all(
    nextFormIds.map(id => dataloaders.forms.load(id))
  );

  return groupements.map(({ quantity, nextFormId }) => {
    const nextForm = nextForms.find(f => f && f.id === nextFormId);
    return {
      form: expandFormFromDb(nextForm!),
      quantity
    };
  });
};

export default groupedInResolver;
