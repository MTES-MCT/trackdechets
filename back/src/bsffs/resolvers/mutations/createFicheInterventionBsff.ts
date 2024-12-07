import { Prisma } from "@prisma/client";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import {
  flattenFicheInterventionBsffInput,
  expandFicheInterventionBsffFromDB
} from "../../converter";
import { checkCanCreateFicheIntervention } from "../../permissions";
import { getBsffFicheInterventionRepository } from "../../repository";
import { sirenifyBsffFicheInterventionInput } from "../../sirenify";
import { validateFicheIntervention } from "../../validation";

const createFicheInterventionBsff: MutationResolvers["createFicheInterventionBsff"] =
  async (_, { input }, context) => {
    const user = checkIsAuthenticated(context);

    const sirenifiedInput = await sirenifyBsffFicheInterventionInput(
      input,
      user
    );
    await checkCanCreateFicheIntervention(user, input);
    const flatInput = flattenFicheInterventionBsffInput(sirenifiedInput);

    await validateFicheIntervention(flatInput);

    const { create: createFicheIntervention } =
      getBsffFicheInterventionRepository(user);

    const ficheIntervention = await createFicheIntervention({
      data: flatInput as Prisma.BsffFicheInterventionCreateInput
    });

    return expandFicheInterventionBsffFromDB(ficheIntervention);
  };

export default createFicheInterventionBsff;
