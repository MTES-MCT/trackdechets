import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import {
  flattenFicheInterventionBsffInput,
  expandFicheInterventionBsffFromDB
} from "../../converter";
import { validateFicheIntervention } from "../../validation";
import { getFicheInterventionBsffOrNotFound } from "../../database";
import { checkCanUpdateFicheIntervention } from "../../permissions";
import { getBsffFicheInterventionRepository } from "../../repository";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] =
  async (_, { id, input }, context) => {
    const user = checkIsAuthenticated(context);

    const existingFicheIntervention = await getFicheInterventionBsffOrNotFound({
      id
    });
    await checkCanUpdateFicheIntervention(
      user,
      existingFicheIntervention,
      input
    );

    // 👇 On extrait packagings avant de flatten
    const { packagings, ...ficheInterventionInput } = input;

    const ficheInterventionData = flattenFicheInterventionBsffInput(
      ficheInterventionInput
    );

    const futureFicheIntervention = {
      ...existingFicheIntervention,
      ...ficheInterventionData
    };

    await validateFicheIntervention(futureFicheIntervention);

    const { update: updateBsffFicheIntervention } =
      getBsffFicheInterventionRepository(user);

    const updatedFicheIntervention = await updateBsffFicheIntervention({
      where: { id: existingFicheIntervention.id },
      data: {
        ...ficheInterventionData,
        // 👇 Si packagings fourni : on reset et reconnecte
        // Si non fourni : on ne touche pas aux relations existantes
        ...(packagings !== undefined
          ? {
              packagings: {
                set: [],
                connect: packagings.map(id => ({ id }))
              }
            }
          : {})
      }
    });

    return expandFicheInterventionBsffFromDB(updatedFicheIntervention);
  };

export default updateFicheInterventionBsff;
