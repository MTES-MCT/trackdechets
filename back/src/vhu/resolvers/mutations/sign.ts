import { Prisma, VhuForm } from "@prisma/client";
import { checkIsAuthenticated } from "src/common/permissions";
import {
  MutationSignVhuFormArgs,
  SignatureTypeInput
} from "src/generated/graphql/types";
import prisma from "src/prisma";
import { GraphQLContext } from "src/types";
import { checkIsCompanyMember } from "src/users/permissions";
import { expandVhuFormFromDb } from "src/vhu/converter";
import { getFormOrFormNotFound } from "src/vhu/database";
import { AlreadySignedError } from "src/vhu/errors";
import { validateVhuForm } from "src/vhu/validation";

type SignatureTypeInfos = {
  dbIncludeKey: keyof Prisma.VhuFormInclude;
  dbKey: keyof VhuForm;
  authorizedSiret: (form: VhuForm) => string;
};

export default async function editVhuForm(
  _,
  { id, vhuSignatureInput }: MutationSignVhuFormArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const signatureTypeInfos = signatureTypeMapping[vhuSignatureInput.type];
  const prismaForm = await getFormOrFormNotFound(id);

  // Current user has the right to sign ?
  await checkIsCompanyMember(
    { id: user.id },
    { siret: signatureTypeInfos.authorizedSiret(prismaForm) }
  );

  // Cannot re-sign a form
  if (prismaForm[signatureTypeInfos.dbKey] != null) {
    throw new AlreadySignedError();
  }

  // Check that all necessary fields are filled
  await validateVhuForm(prismaForm, {
    emitterSignature:
      prismaForm.emitterSignatureId != null ||
      vhuSignatureInput.type === "SENT",
    transporterSignature:
      prismaForm.transporterSignatureId != null ||
      vhuSignatureInput.type === "TRANSPORT",
    recipientAcceptanceSignature:
      prismaForm.recipientAcceptanceSignatureId != null ||
      vhuSignatureInput.type === "ACCEPTANCE",
    recipientOperationSignature:
      prismaForm.recipientOperationSignatureId != null ||
      vhuSignatureInput.type === "OPERATION"
  });

  const signedForm = await prisma.vhuForm.update({
    where: { id },
    data: {
      [signatureTypeInfos.dbIncludeKey]: {
        create: {
          signatory: { connect: { id: user.id } },
          signedBy: vhuSignatureInput.signedBy,
          signedAt: vhuSignatureInput.signedAt ?? new Date()
        }
      },
      isDraft: false, // If it was one, signing always "un-drafts" it
      ...(vhuSignatureInput.type === "OPERATION" && { status: "DONE" }) // Last signature means the form is done
    }
  });

  return expandVhuFormFromDb(signedForm);
}

const signatureTypeMapping: Record<SignatureTypeInput, SignatureTypeInfos> = {
  SENT: {
    dbIncludeKey: "emitterSignature",
    dbKey: "emitterSignatureId",
    authorizedSiret: form => form.emitterCompanySiret
  },
  ACCEPTANCE: {
    dbIncludeKey: "recipientAcceptanceSignature",
    dbKey: "recipientAcceptanceSignatureId",
    authorizedSiret: form => form.recipientCompanySiret
  },
  OPERATION: {
    dbIncludeKey: "recipientOperationSignature",
    dbKey: "recipientOperationSignatureId",
    authorizedSiret: form => form.recipientCompanySiret
  },
  TRANSPORT: {
    dbIncludeKey: "transporterSignature",
    dbKey: "transporterSignatureId",
    authorizedSiret: form => form.transporterCompanySiret
  }
};
