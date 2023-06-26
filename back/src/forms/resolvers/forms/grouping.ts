import { FormResolvers } from "../../../generated/graphql/types";
import { expandInitialFormFromDb } from "../../converter";

const groupingResolver: FormResolvers["grouping"] = async (
  form,
  _,
  { dataloaders }
) => {
  const groupements = await dataloaders.nextFormGoupements.load(form.id);
  const initialFormIds = groupements.map(g => g.initialFormId);
  const initialForms = await Promise.all(
    initialFormIds.map(id => dataloaders.forms.load(id))
  );

  return Promise.all(
    groupements.map(async ({ quantity, initialFormId }) => {
      const initialForm = initialForms.find(f => f && f.id === initialFormId);
      if (!initialForm) {
        throw new Error(`Invalid initial form with id ${initialFormId}`);
      }

      return {
        form: await expandInitialFormFromDb(
          initialForm,
          dataloaders.forwardedIns
        ),
        quantity
      };
    })
  );
};

export default groupingResolver;
