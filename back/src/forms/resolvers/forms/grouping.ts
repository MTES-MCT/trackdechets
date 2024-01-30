import { FormResolvers } from "../../../generated/graphql/types";
import { expandInitialFormFromDb } from "../../converter";

const groupingResolver: FormResolvers["grouping"] = async (
  form,
  _,
  { dataloaders }
) => {
  if (form.grouping) {
    return form.grouping;
  }

  const groupements = await dataloaders.nextFormGoupements.load(form.id);
  const initialFormIds = groupements.map(g => g.initialFormId);
   // Expandable fields are enough here, but the emitter sub-resolver requires the full form.
   // And because the dashboard uses this field, we use the formsForReadCheck dataloader instead of forms.
   // So this overfetches for forms required without the emitter.
  const initialForms = await Promise.all(
    initialFormIds.map(id => dataloaders.formsForReadCheck.load(id))
  );

  return groupements.map(({ quantity, initialFormId }) => {
    const initialForm = initialForms.find(f => f && f.id === initialFormId);
    if (!initialForm) {
      throw new Error(`Invalid initial form with id ${initialFormId}`);
    }

    return {
      form: expandInitialFormFromDb(initialForm),
      quantity
    };
  });
};

export default groupingResolver;
