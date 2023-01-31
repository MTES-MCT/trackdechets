import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import {
  flattenFicheInterventionBsffInput,
  expandFicheInterventionBsffFromDB
} from "../../converter";
import { checkCanWriteFicheIntervention } from "../../permissions";
import { getBsffFicheInterventionRepository } from "../../repository";
import { validateFicheIntervention } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createFicheInterventionBsff"] =
  async (_, { input }, context) => {
    const user = checkIsAuthenticated(context);

    const flatInput = flattenFicheInterventionBsffInput(input);
    await checkCanWriteFicheIntervention(user, flatInput);

    await validateFicheIntervention(flatInput);

    const { create: createFicheIntervention } =
      getBsffFicheInterventionRepository(user);

    const ficheIntervention = await createFicheIntervention({
      data: flatInput
    });

    return expandFicheInterventionBsffFromDB(ficheIntervention);
  };

export default createFicheInterventionBsff;
