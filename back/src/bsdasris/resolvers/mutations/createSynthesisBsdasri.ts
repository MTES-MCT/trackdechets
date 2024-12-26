import type { BsdasriInput } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri } from "../../validation";
import { getEligibleDasrisForSynthesis, aggregatePackagings } from "./utils";
import { getBsdasriForElastic, indexBsdasri } from "../../elastic";
import { BsdasriType } from "@prisma/client";
import { getBsdasriRepository } from "../../repository";
import { sirenify } from "../../sirenify";
import { checkCanCreateSynthesis } from "../../permissions";
import { UserInputError } from "../../../common/errors";

/**
 * Bsdasri creation mutation :
 * sets bsdasri type to `SYNTHESIS`
 * draft is not allowed
 * checks
 * sets status to `INITIAL`
 * aggregate child dasris packagings into emitter and tranporter packagings
 * aggregate child dasris transporter volumes into emitter and tranporter volumes
 */
const createSynthesisBsdasri = async (
  input: BsdasriInput,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  if (
    input?.emitter ||
    input?.ecoOrganisme ||
    input?.transporter?.transport?.packagings
  ) {
    throw new UserInputError(
      `Les champs emitter, ecoOrganisme et packagings ne sont pas acceptés pour la création d'un dasri de synthèse `
    );
  }

  await checkCanCreateSynthesis(user, input);

  const { synthesizing, ...rest } = input;

  if (!synthesizing || !synthesizing.length) {
    throw new UserInputError(
      "Un dasri de synthèse doit comporter des bordereaux associés"
    );
  }

  const dasrisToAssociate = await getEligibleDasrisForSynthesis(
    synthesizing,
    null,
    input.transporter?.company
  );

  const aggregatedPackagings = aggregatePackagings(dasrisToAssociate);

  const summedVolumes = dasrisToAssociate
    .map(dasri => dasri.transporterWasteVolume ?? 0)
    .reduce((prev, curr) => prev + curr, 0);

  const sirenifiedInput = await sirenify(rest, user);

  const flattenedInput = {
    ...flattenBsdasriInput(sirenifiedInput),
    emitterCompanyName: rest.transporter?.company?.name,
    emitterCompanySiret: rest.transporter?.company?.siret,
    emitterCompanyAddress: rest.transporter?.company?.address,
    emitterCompanyContact: rest.transporter?.company?.contact,
    emitterCompanyPhone: rest.transporter?.company?.phone,
    emitterCompanyMail: rest.transporter?.company?.mail,
    emitterWastePackagings: aggregatedPackagings,
    emitterWasteVolume: summedVolumes,
    transporterWastePackagings: aggregatedPackagings,
    transporterWasteVolume: summedVolumes
  };

  const synthesizedBsdasrisId = synthesizing.map(id => ({ id }));

  await validateBsdasri(flattenedInput, {
    emissionSignature: true,
    isSynthesis: true
  });
  const bsdasriRepository = getBsdasriRepository(user);

  const newDasri = await bsdasriRepository.create({
    ...flattenedInput,
    id: getReadableId(ReadableIdPrefix.DASRI),
    type: BsdasriType.SYNTHESIS,
    synthesizing: { connect: synthesizedBsdasrisId }
  });
  const expandeBsdasri = expandBsdasriFromDB(newDasri);
  await indexBsdasri(await getBsdasriForElastic(newDasri), context);

  return expandeBsdasri;
};

export default createSynthesisBsdasri;
