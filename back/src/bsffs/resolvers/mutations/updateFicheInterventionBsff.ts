import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  expandFicheInterventionBsffFromDB
} from "../../converter";
import { validateFicheIntervention } from "../../validation";
import { getFicheInterventionBsffOrNotFound } from "../../database";
import { checkCanWriteFicheIntervention } from "../../permissions";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] =
  async (_, { id, input }, context) => {
    const user = checkIsAuthenticated(context);
    const ficheInterventionData = flattenFicheInterventionBsffInput(input);

    const existingFicheIntervention = await getFicheInterventionBsffOrNotFound({
      id
    });
    await checkCanWriteFicheIntervention(user, existingFicheIntervention);

    const futureFicheIntervention = {
      ...existingFicheIntervention,
      ...ficheInterventionData
    };
    await checkCanWriteFicheIntervention(user, futureFicheIntervention);

    await validateFicheIntervention(futureFicheIntervention);

    const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
      data: ficheInterventionData,
      where: { id: existingFicheIntervention.id }
    });

    return expandFicheInterventionBsffFromDB(updatedFicheIntervention);
  };

export default updateFicheInterventionBsff;
