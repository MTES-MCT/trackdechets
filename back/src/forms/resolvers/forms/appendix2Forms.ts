import { FormResolvers } from "../../../generated/graphql/types";
import { expandAppendix2FormFromDb } from "../../converter";
import { getFormRepository } from "../../repository";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async (
  form,
  _,
  { user }
) => {
  const { findAppendix2FormsById } = getFormRepository(user);
  const appendix2Forms = await findAppendix2FormsById(form.id);
  return appendix2Forms.map(expandAppendix2FormFromDb);
};

export default appendix2FormsResolver;
