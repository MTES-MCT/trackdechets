import { Form } from "../../generated/prisma-client";
import { GraphQLContext } from "../../types";
import { unflattenObjectFromDb } from "../form-converter";
import { logStatusChange } from "../mutations/mark-as";
import { formSchema } from "../validator";

export async function validateForm(form: Form) {
  const formattedForm = unflattenObjectFromDb(form);
  const isValid = await formSchema.isValid(formattedForm);
  return isValid ? Promise.resolve() : Promise.reject();
}

export async function validateSecurityCode(
  form: Form,
  securityCode: number,
  requestContext: GraphQLContext
) {
  const exists = await requestContext.prisma.$exists.company({
    siret: form.emitterCompanySiret,
    securityCode
  });
  return exists ? Promise.resolve() : Promise.reject();
}

export async function markFormAppendixAwaitingFormsAsGrouped(
  formId: string,
  requestContext: GraphQLContext
) {
  const appendix2Forms = await requestContext.prisma
    .form({ id: formId })
    .appendix2Forms();

  if (!appendix2Forms.length) {
    return;
  }

  return requestContext.prisma.updateManyForms({
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
  const appendix2Forms = await requestContext.prisma
    .form({ id: formId })
    .appendix2Forms();

  if (appendix2Forms.length) {
    appendix2Forms.map(f => logStatusChange(f.id, "PROCESSED", requestContext, "", {}));

    await requestContext.prisma.updateManyForms({
      where: { OR: appendix2Forms.map(f => ({ id: f.id })) },
      data: { status: "PROCESSED" }
    });
  }
}
