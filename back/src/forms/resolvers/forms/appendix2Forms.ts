import type { FormResolvers } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  expandInitialFormFromDb,
  expandableFormIncludes
} from "../../converter";

const appendix2FormsResolver: FormResolvers["appendix2Forms"] = async (
  form,
  _
) => {
  if (form.emitter?.type !== "APPENDIX2") {
    return null;
  }

  const grouping = await prisma.form
    .findUnique({ where: { id: form.id } })
    .grouping({
      include: { initialForm: { include: expandableFormIncludes } }
    });
  const appendix2Forms = grouping?.map(g => g.initialForm) ?? [];

  return appendix2Forms.map(form => expandInitialFormFromDb(form));
};

export default appendix2FormsResolver;
