import { DomainError, ErrorCode } from "../../common/errors";
import { Form, Status } from "../../generated/prisma-client";
import { Context } from "../../types";
import { unflattenObjectFromDb } from "../form-converter";
import { formSchema } from "../validator";
import { getNextPossibleStatus } from "../workflow";

export async function markAsSealed(_, { id }, context: Context) {
  return markAs("SEALED", { id }, context, async form => {
    await validateForm(form);
    await markFormAppendixAwaitingFormsAsGrouped(form.id, context);
  });
}

export async function markAsSent(_, { id, sentInfo }, context: Context) {
  return markAs("SENT", { id, input: sentInfo }, context, form =>
    markFormAppendixAwaitingFormsAsGrouped(form.id, context)
  );
}

export async function markAsReceived(
  _,
  { id, receivedInfo },
  context: Context
) {
  return markAs("RECEIVED", { id, input: receivedInfo }, context);
}

export async function markAsProcessed(
  _,
  { id, processedInfo },
  context: Context
) {
  return markAs("PROCESSED", { id, input: processedInfo }, context, async _ => {
    const appendix2Forms = await context.prisma.form({ id }).appendix2Forms();
    if (appendix2Forms.length) {
      appendix2Forms.map(f => logStatusChange(f.id, "PROCESSED", context));

      await context.prisma.updateManyForms({
        where: { OR: appendix2Forms.map(f => ({ id: f.id })) },
        data: { status: "PROCESSED" }
      });
    }
  });
}

export async function signedByTransporter(
  _,
  { id, signingInfo },
  context: Context
) {
  const input = {
    sentAt: signingInfo.sentAt,
    signedByTransporter: true,
    sentBy: signingInfo.sentBy,
    wasteDetailsPackagings: signingInfo.packagings,
    wasteDetailsQuantity: signingInfo.quantity,
    wasteDetailsOnuCode: signingInfo.onuCode
  };
  return markAs("SENT", { id, input }, context, async form => {
    if (!signingInfo.signedByTransporter || !signingInfo.signedByProducer) {
      throw new DomainError(
        "Le transporteur et le producteur du déchet doivent tous deux valider l'enlèvement",
        ErrorCode.BAD_USER_INPUT
      );
    }

    const hasCorrectSecurityCode = await context.prisma.$exists.company({
      siret: form.emitterCompanySiret,
      securityCode: signingInfo.securityCode
    });

    if (!hasCorrectSecurityCode) {
      throw new DomainError(
        "Code de sécurité producteur incorrect. En cas de doute vérifiez sa valeur sur votre espace dans l'onglet 'Mon compte'",
        ErrorCode.FORBIDDEN
      );
    }
  });
}

async function markAs(
  status: Status,
  { id, input = {} }: { id: string; input?: any },
  context: Context,
  beforeSaveHook: (form: Form) => Promise<any> = () => Promise.resolve()
) {
  const form = await context.prisma.form({ id });
  const possibleStatus = await getNextPossibleStatus(
    { ...form, ...input },
    context
  );

  if (!possibleStatus.includes(status)) {
    throw new DomainError(
      `Vous ne pouvez pas passer ce bordereau à l'état "${status}".`,
      ErrorCode.FORBIDDEN
    );
  }

  await logStatusChange(id, status, context);
  await beforeSaveHook(form);

  return context.prisma.updateForm({
    where: { id },
    data: { status, ...input }
  });
}

function logStatusChange(formId, status, context: Context) {
  return context.prisma
    .createStatusLog({
      form: { connect: { id: formId } },
      user: { connect: { id: context.user.id } },
      status
    })
    .catch(err => {
      console.error(
        `Cannot log status change for form ${formId}, user ${context.user.id}, status ${status}`,
        err
      );
      throw new Error("Problème technique, merci de réessayer plus tard.");
    });
}

async function validateForm(form: Form) {
  const formattedForm = unflattenObjectFromDb(form);
  const isValid = await formSchema.isValid(formattedForm);

  if (!isValid) {
    const errors: string[] = await formSchema
      .validate(formattedForm, { abortEarly: false })
      .catch(err => err.errors);
    throw new DomainError(
      `Erreur, impossible de sceller le bordereau car des champs obligatoires ne sont pas renseignés.\nErreur(s): ${errors.join(
        "\n"
      )}`,
      ErrorCode.BAD_USER_INPUT
    );
  }
}

async function markFormAppendixAwaitingFormsAsGrouped(
  formId: string,
  context: Context
) {
  const appendix2Forms = await context.prisma
    .form({ id: formId })
    .appendix2Forms();

  if (!appendix2Forms.length) {
    return;
  }

  return context.prisma.updateManyForms({
    where: {
      status: "AWAITING_GROUP",
      OR: appendix2Forms.map(f => ({ id: f.id }))
    },
    data: { status: "GROUPED" }
  });
}
