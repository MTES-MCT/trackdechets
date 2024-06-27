import { Prisma } from "@prisma/client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getFirstTransporterSync } from "../../database";
import { expandBsffFromDB } from "../../converter";
import { checkCanUpdate } from "../../permissions";
import { getBsffRepository } from "../../repository";
import { BsffWithTransportersInclude } from "../../types";
import { mergeInputAndParseBsffAsync } from "../../validation/bsff";
import { UserInputError } from "../../../common/errors";

const updateBsff: MutationResolvers["updateBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsff = await getBsffOrNotFound({ id });

  // Un premier transporteur est initialisé dans la mutation `createBsff`
  // ce qui permet d'être certain que `transporter` est défini
  const existingFirstTransporter = getFirstTransporterSync(existingBsff)!;

  await checkCanUpdate(user, existingBsff, input);

  if (input.type && input.type !== existingBsff.type) {
    throw new UserInputError(
      "Vous ne pouvez pas modifier le type de BSFF après création"
    );
  }

  const { parsedBsff, updatedFields } = await mergeInputAndParseBsffAsync(
    existingBsff,
    input,
    { user }
  );

  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsffFromDB(existingBsff);
  }

  const { updateBsff: updateBsff } = getBsffRepository(user);

  const {
    transporters: parsedTransporters,
    packagings,
    ficheInterventions,
    forwarding,
    repackaging,
    grouping,
    ...bsff
  } = parsedBsff;

  const data: Prisma.BsffUpdateInput = { ...bsff };

  const packagingHasChanged = [
    "forwarding",
    "grouping",
    "repackaging",
    "packagings"
  ].some(f => updatedFields.includes(f));

  if (packagingHasChanged) {
    data.packagings = {
      deleteMany: {},
      create: (packagings ?? []).map(packaging => {
        const { id, previousPackagings, ...packagingData } = packaging;
        return {
          ...packagingData,
          previousPackagings: {
            connect: (previousPackagings ?? []).map(id => ({ id }))
          }
        };
      })
    };
  }

  let transporters:
    | Prisma.BsffTransporterUpdateManyWithoutBsffNestedInput
    | undefined = undefined;

  if (updatedFields.includes("transporters")) {
    if (input.transporter) {
      if (existingFirstTransporter) {
        // on met à jour le premier transporteur existant
        const { id, number, bsffId, ...data } = parsedTransporters![0];
        transporters = { update: { where: { id: id! }, data } };
      } else {
        // on crée le premier transporteur
        const { id, bsffId, ...data } = parsedTransporters![0];
        transporters = { create: { ...data, number: 1 } };
      }
    } else {
      // Cas où l'update est fait via `BsffInput.transporters`. On déconnecte tous les transporteurs qui étaient
      // précédement associés et on connecte les nouveaux transporteurs de la table `BsffTransporter`
      // avec ce bordereau. La fonction `update` du repository s'assure que la numérotation des
      // transporteurs correspond à l'ordre du tableau d'identifiants.
      transporters = {
        set: [],
        connect: parsedTransporters!.map(t => ({ id: t.id! }))
      };
    }

    data.transporters = transporters;
  }

  if (updatedFields.includes("ficheInterventions")) {
    data.ficheInterventions = {
      set: [],
      connect: (ficheInterventions ?? []).map(id => {
        return { id };
      })
    };
  }

  const updatedBsff = await updateBsff({
    where: { id },
    data,
    include: BsffWithTransportersInclude
  });

  return expandBsffFromDB(updatedBsff);
};

export default updateBsff;
