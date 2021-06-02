import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBsdaArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { expandBsdaFromDb, flattenBsdaInput } from "../../converter";
import { getFormOrFormNotFound } from "../../database";
import { checkKeysEditability } from "../../edition-rules";
import {
  checkCanAssociateBsdas,
  checkIsFormContributor
} from "../../permissions";
import { validateBsda } from "../../validation";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsdaArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const prismaForm = await getFormOrFormNotFound(id);
  await checkIsFormContributor(
    user,
    prismaForm,
    "Vous ne pouvez pas modifier un bordereau sur lequel votre entreprise n'apparait pas"
  );

  checkKeysEditability(input, prismaForm);

  const formUpdate = flattenBsdaInput(input);

  const resultingForm = { ...prismaForm, ...formUpdate };
  await checkIsFormContributor(
    user,
    resultingForm,
    "Vous ne pouvez pas enlever votre établissement du bordereau"
  );

  await validateBsda(resultingForm, {
    emissionSignature: prismaForm.emitterEmissionSignatureAuthor != null,
    workSignature: prismaForm.workerWorkSignatureAuthor != null,
    operationSignature: prismaForm.destinationOperationSignatureAuthor != null,
    transportSignature: prismaForm.transporterTransportSignatureAuthor != null
  });

  await checkCanAssociateBsdas(input.associations);
  const bsdas = input.associations
    ? { set: input.associations.map(id => ({ id })) }
    : undefined;

  const updatedForm = await prisma.bsda.update({
    where: { id },
    data: {
      ...formUpdate,
      bsdas
    }
  });

  return expandBsdaFromDb(updatedForm);
}
