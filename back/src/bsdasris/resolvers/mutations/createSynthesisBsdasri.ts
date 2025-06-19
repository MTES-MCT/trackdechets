import type { BsdasriInput } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";

import { expandBsdasriFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getEligibleDasrisForSynthesis, aggregatePackagings } from "./utils";
import { BsdasriType } from "@prisma/client";
import { getBsdasriRepository } from "../../repository";
import { checkCanCreateSynthesis } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { parseBsdasriAsync } from "../../validation";
import { graphQlInputToZodBsdasri } from "../../validation/helpers";
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

  const { synthesizing } = input;

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

  const zodBsdasri = graphQlInputToZodBsdasri(input);

  const payload = {
    ...zodBsdasri,
    emitterCompanyName: zodBsdasri.transporterCompanyName,
    emitterCompanySiret: zodBsdasri.transporterCompanySiret,
    emitterCompanyAddress: zodBsdasri.transporterCompanyAddress,
    emitterCompanyContact: zodBsdasri.transporterCompanyContact,
    emitterCompanyPhone: zodBsdasri.transporterCompanyPhone,
    emitterCompanyMail: zodBsdasri.transporterCompanyMail,
    emitterWastePackagings: aggregatedPackagings,
    emitterWasteVolume: summedVolumes,
    transporterWastePackagings: aggregatedPackagings,
    transporterWasteVolume: summedVolumes
  };

  const synthesizedBsdasris = synthesizing.map(id => ({ id }));

  const { createdAt, ...parsedZodBsdasri } = await parseBsdasriAsync(
    { ...payload, isDraft: false, createdAt: new Date() },
    {
      user,
      currentSignatureType: "EMISSION"
    }
  );

  const {
    grouping,
    synthesizing: x,
    intermediaries,
    ...createInput
  } = parsedZodBsdasri;

  const bsdasriRepository = getBsdasriRepository(user);
  const newDasri = await bsdasriRepository.create({
    ...createInput,
    type: BsdasriType.SYNTHESIS,
    synthesizing: { connect: synthesizedBsdasris }
  });

  return expandBsdasriFromDB(newDasri);
};

export default createSynthesisBsdasri;
