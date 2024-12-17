import type { FormResolvers } from "@td/codegen-back";
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
  const initialForms = await dataloaders.formsForReadCheck.loadMany(
    initialFormIds.map(id => id)
  );
  const initialFormsDictionnary = initialForms.reduce((dic, initialForm) => {
    if (!(initialForm instanceof Error) && initialForm) {
      dic[initialForm.id] = initialForm;
    }
    return dic;
  }, {});

  return groupements.map(({ quantity, initialFormId }) => {
    const initialForm = initialFormsDictionnary[initialFormId];
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
