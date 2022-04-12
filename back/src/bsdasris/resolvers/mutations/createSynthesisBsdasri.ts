import { BsdasriInput } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import prisma from "../../../prisma";

import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri } from "../../validation";
import { checkIsBsdasriContributor } from "../../permissions";
import { getEligibleDasrisForSynthesis, aggregatePackagings } from "./utils";
import { indexBsdasri } from "../../elastic";
import { UserInputError } from "apollo-server-express";
import { BsdasriType } from "@prisma/client";
import { getCachedUserSirets } from "../../../common/redis/users";

/**
 * Bsdasri creation mutation :
 * sets bsdasri type to `SYNTHESIS`
 * draft is not allowed
 * checks 
 * sets status to `INITIAL`
 * aggregate child dasris packagings into emitter and tranporter packagings
 * aggrsumegate child dasris transporter volumes into emitter and tranporter volumes

 */
const createSynthesisBsdasri = async (
  input: BsdasriInput,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);
  const userSirets = await getCachedUserSirets(user.id);

  if (input?.emitter || input?.ecoOrganisme) {
    throw new UserInputError(
      `Les champs emitter, ecoOrganisme ne sont pas acceptés pour la création d'un dasri de synthèse `
    );
  }

  if (!userSirets.includes(input.transporter.company.siret)) {
    throw new UserInputError(
      `Le siret du transporteur doit être un des vôtres`
    );
  }
  const { synthesizing, ...rest } = input;

  if (!synthesizing.length) {
    throw new UserInputError(
      "Un dasri de synthèse doit comporter des bordereaux associés"
    );
  }
  const formSirets = {
    emitterCompanySiret: input.transporter?.company?.siret,
    transporterCompanySiret: input.transporter?.company?.siret,
    destinationCompanySiret: input.destination?.company?.siret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  const dasrisToAssociate = await getEligibleDasrisForSynthesis(
    synthesizing,
    input.transporter.company.siret
  );

  const aggregatedPackagings = aggregatePackagings(dasrisToAssociate);

  const summedVolumes = dasrisToAssociate
    .map(dasri => dasri.transporterWasteVolume ?? 0)
    .reduce((prev, curr) => prev + curr, 0);

  const flattenedInput = {
    ...flattenBsdasriInput(rest),
    emitterCompanyName: rest.transporter.company.name,
    emitterCompanySiret: rest.transporter.company.siret,
    emitterCompanyAddress: rest.transporter.company.address,
    emitterCompanyContact: rest.transporter.company.contact,
    emitterCompanyPhone: rest.transporter.company.phone,
    emitterCompanyMail: rest.transporter.company.mail,
    emitterWastePackagings: aggregatedPackagings,
    emitterWasteVolume: summedVolumes,
    transporterWastePackagings: aggregatedPackagings,
    transporterWasteVolume: summedVolumes
  };

  const synthesizedBsdasrisId = synthesizing.map(id => ({ id }));

  await validateBsdasri(flattenedInput, {
    emissionSignature: true
  });

  const newDasri = await prisma.bsdasri.create({
    data: {
      ...flattenedInput,
      id: getReadableId(ReadableIdPrefix.DASRI),
      type: BsdasriType.SYNTHESIS,

      synthesizing: { connect: synthesizedBsdasrisId }
    }
  });
  const expandeBsdasri = expandBsdasriFromDB(newDasri);
  await indexBsdasri(newDasri, context);

  return expandeBsdasri;
};

export default createSynthesisBsdasri;
