import { FormResolvers } from "../../../generated/graphql/types";
import { expandAppendix2FormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async (
  form,
  _,
  { user, dataloaders }
) => {
  const { findAppendix2FormsById } = getFormRepository(user);
  const appendix2Forms = await findAppendix2FormsById(form.id);
  return appendix2Forms.map(form =>
    expandAppendix2FormFromDb(form, dataloaders.forwardedIns)
  );
};

export default appendix2FormsResolver;
