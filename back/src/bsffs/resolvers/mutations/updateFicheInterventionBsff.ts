import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
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
    const ficheInterventionData = flattenFicheInterventionBsffInput(input);

    const existingFicheIntervention = await getFicheInterventionBsffOrNotFound({
      id
    });
    await checkCanUpdateFicheIntervention(
      user,
      existingFicheIntervention,
      input
    );

    const futureFicheIntervention = {
      ...existingFicheIntervention,
      ...ficheInterventionData
    };

    await validateFicheIntervention(futureFicheIntervention);

    const { update: updateBsffFicheIntervention } =
      getBsffFicheInterventionRepository(user);

    const updatedFicheIntervention = await updateBsffFicheIntervention({
      data: ficheInterventionData,
      where: { id: existingFicheIntervention.id }
    });

    return expandFicheInterventionBsffFromDB(updatedFicheIntervention);
  };

export default updateFicheInterventionBsff;
