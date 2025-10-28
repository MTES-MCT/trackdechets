import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationUpdateBsvhuArgs } from "@td/codegen-back";
import { Prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import {
  companyToIntermediaryInput,
  expandVhuFormFromDb
} from "../../converter";
import { getBsvhuOrNotFound, getFirstTransporterSync } from "../../database";
import { mergeInputAndParseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";
import { checkCanUpdate } from "../../permissions";
import { BsvhuForParsingInclude } from "../../validation/types";

export default async function edit(
  _,
  { id, input }: MutationUpdateBsvhuArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBsvhu = await getBsvhuOrNotFound(id, {
    include: BsvhuForParsingInclude
  });

  await checkCanUpdate(user, existingBsvhu, input);

  const { parsedBsvhu, updatedFields } = await mergeInputAndParseBsvhuAsync(
    existingBsvhu,
    input,
    { user }
  );
  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandVhuFormFromDb(existingBsvhu);
  }

  const intermediaries = parsedBsvhu.intermediaries
    ? {
        deleteMany: {},
        ...(parsedBsvhu.intermediaries.length > 0 && {
          create: companyToIntermediaryInput(parsedBsvhu.intermediaries)
        })
      }
    : undefined;

  const existingFirstTransporter = getFirstTransporterSync(existingBsvhu);

  let transporters:
    | Prisma.BsvhuTransporterUpdateManyWithoutBsvhuNestedInput
    | undefined = undefined;

  if (updatedFields.includes("transporters")) {
    if (input.transporter) {
      if (existingFirstTransporter) {
        // on met à jour le premier transporteur existant
        const { id, number, bsvhuId, createdAt, ...data } =
          parsedBsvhu.transporters![0];
        transporters = { update: { where: { id: id! }, data } };
      } else {
        // on crée le premier transporteur
        const { id, bsvhuId, createdAt, ...data } =
          parsedBsvhu.transporters![0];
        transporters = { create: { ...data, number: 1 } };
      }
    } else {
      // Cas où l'update est fait via `BsvhuInput.transporters`. On déconnecte tous les transporteurs qui étaient
      // précédement associés et on connecte les nouveaux transporteurs de la table `BsvhuTransporter`
      // avec ce bordereau. La fonction `update` du repository s'assure que la numérotation des
      // transporteurs correspond à l'ordre du tableau d'identifiants.
      transporters = {
        set: [],
        connect: parsedBsvhu.transporters!.map(t => ({ id: t.id! }))
      };
    }
  }

  const { update } = getBsvhuRepository(user);
  const { createdAt, ...bsvhu } = parsedBsvhu;

  const updatedBsvhu = await update(
    { id },
    {
      ...bsvhu,
      intermediaries,
      transporters
    }
  );

  return expandVhuFormFromDb(updatedBsvhu);
}
