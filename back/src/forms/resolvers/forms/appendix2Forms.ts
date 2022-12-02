import { FormResolvers } from "../../../generated/graphql/types";
import { expandInitialFormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async (
  form,
  _,
  { user, dataloaders }
) => {
  if (form.emitter?.type !== "APPENDIX2") {
    return null;
  }

  const { findGroupedFormsById } = getFormRepository(user);
  const appendix2Forms = await findGroupedFormsById(form.id);
  return appendix2Forms.map(form =>
    expandInitialFormFromDb(form, dataloaders.forwardedIns)
  );
};

export default appendix2FormsResolver;
