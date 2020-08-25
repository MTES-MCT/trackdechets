import { Form, prisma } from "../../generated/prisma-client";
import { GraphQLContext } from "../../types";
import { expandFormFromDb } from "../form-converter";
import { logStatusChange } from "../mutations/mark-as";
import { formSchema } from "../validator";

export async function validateForm(form: Form) {
  const formattedForm = expandFormFromDb(form);
  const isValid = await formSchema.isValid(formattedForm);
  return isValid ? Promise.resolve() : Promise.reject();
}

export async function markFormAppendixAwaitingFormsAsGrouped(formId: string) {
  const appendix2Forms = await prisma.form({ id: formId }).appendix2Forms();

  if (!appendix2Forms.length) {
    return;
  }

  return prisma.updateManyForms({
    where: {
      status: "AWAITING_GROUP",
      OR: appendix2Forms.map(f => ({ id: f.id }))
    },
    data: { status: "GROUPED" }
  });
}

export async function markFormAppendixGroupedsAsProcessed(
  formId: string,
  requestContext: GraphQLContext
) {
  const appendix2Forms = await prisma.form({ id: formId }).appendix2Forms();

  if (appendix2Forms.length) {
    await Promise.all(
      appendix2Forms.map(f =>
        logStatusChange(f.id, "PROCESSED", requestContext, "", {})
      )
    );
    await prisma.updateManyForms({
      where: { OR: appendix2Forms.map(f => ({ id: f.id })) },
      data: { status: "PROCESSED" }
    });
  }
}
