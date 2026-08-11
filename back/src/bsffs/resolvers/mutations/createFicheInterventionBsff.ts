import { Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
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

    // 👇 On extrait packagings avant de flatten
    const { packagings, ...ficheInterventionInput } = sirenifiedInput;

    const flatInput = flattenFicheInterventionBsffInput(ficheInterventionInput);

    await validateFicheIntervention(flatInput);

    const { create: createFicheIntervention } =
      getBsffFicheInterventionRepository(user);

    const ficheIntervention = await createFicheIntervention({
      data: {
        ...(flatInput as Prisma.BsffFicheInterventionCreateInput),
        ...(packagings?.length
          ? {
              packagings: {
                connect: packagings.map(id => ({ id }))
              }
            }
          : {})
      }
    });

    return expandFicheInterventionBsffFromDB(ficheIntervention);
  };

export default createFicheInterventionBsff;
