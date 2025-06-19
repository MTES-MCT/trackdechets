import { expandBsdasriFromDB } from "../../converter";
import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";
import type { BsdasriInput } from "@td/codegen-back";

import { mergeInputAndParseBsdasriAsync } from "../../validation";
import { getEligibleDasrisForSynthesis, aggregatePackagings } from "./utils";
import {
  getBsdasriRepository,
  getReadonlyBsdasriRepository
} from "../../repository";

import { UserInputError } from "../../../common/errors";
import { PrismaBsdasriForParsing } from "../../validation/types";

const buildSynthesizedBsdasriArgs = async (
  dasrisToAssociate: Bsdasri[] | null | undefined,
  status: BsdasriStatus
) => {
  if (!dasrisToAssociate?.length) {
    return {};
  }

  const aggregatedPackagings = aggregatePackagings(dasrisToAssociate);

  const summedVolumes = dasrisToAssociate
    .map(dasri => dasri.transporterWasteVolume ?? 0)
    .reduce((prev, curr) => prev + curr, 0);

  const args = {
    ...(status === BsdasriStatus.INITIAL
      ? {
          emitterWastePackagings: aggregatedPackagings,
          emitterWasteVolume: summedVolumes,
          transporterWastePackagings: aggregatedPackagings,
          transporterWasteVolume: summedVolumes
        }
      : {})
  };

  return args;
};

const updateSynthesisBsdasri = async ({
  id,
  input,
  dbBsdasri,
  dbSynthesizing,
  user
}: {
  id: string;
  input: BsdasriInput;
  dbBsdasri: PrismaBsdasriForParsing;
  dbSynthesizing: any;
  user: Express.User;
}) => {
  const { grouping: inputGrouping, synthesizing: inputSynthesizing } = input;

  // Validate form input
  if (
    inputGrouping &&
    inputGrouping.length > 0 &&
    dbBsdasri.type !== BsdasriType.GROUPING
  ) {
    throw new UserInputError(
      "Le champ grouping n'est accessible que sur les dasri de groupement"
    );
  }

  // Validate form input
  if (
    inputGrouping &&
    inputGrouping.length > 0 &&
    dbBsdasri.type !== BsdasriType.GROUPING
  ) {
    throw new UserInputError(
      "Le champ grouping n'est accessible que sur les dasri de groupement"
    );
  }

  if (inputSynthesizing !== undefined) {
    if (dbBsdasri.status !== BsdasriStatus.INITIAL) {
      throw new UserInputError(
        "Les bordereaux associés à ce bsd ne sont plus modifiables"
      );
    }
    // Forbid empty associated dasris
    if (!inputSynthesizing?.length) {
      throw new UserInputError(
        "Un bordereau de synthèse doit comporter des bordereaux associés"
      );
    }
  }

  if (!!inputSynthesizing?.length) {
    // filter dasris already associated to current dasri
    const newDasrisToAssociate = inputSynthesizing.filter(
      el => !dbSynthesizing.map(el => el.id).includes(el)
    );
    // check associated dasris meet eligibility criteria
    await getEligibleDasrisForSynthesis(newDasrisToAssociate, dbBsdasri);
  }

  const bsdasriReadonlyRepository = getReadonlyBsdasriRepository();
  const dasrisToAssociate = !!inputSynthesizing?.length
    ? await bsdasriReadonlyRepository.findMany({
        id: { in: inputSynthesizing }
      })
    : [];
  const synthesizedBsdasriArgs = await buildSynthesizedBsdasriArgs(
    dasrisToAssociate,
    dbBsdasri.status
  );

  const { parsedBsdasri, updatedFields } = await mergeInputAndParseBsdasriAsync(
    dbBsdasri,
    input,
    { user }
  );

  if (updatedFields.length === 0 && !inputSynthesizing?.length) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsdasriFromDB(dbBsdasri);
  }
  const { createdAt, grouping, synthesizing, intermediaries, ...newBsdasri } =
    parsedBsdasri;

  const synthesizingArgs = !!inputSynthesizing?.length
    ? {
        synthesizing: {
          set: inputSynthesizing.map(id => ({
            id
          }))
        }
      }
    : {};
  const bsdasriRepository = getBsdasriRepository(user);

  const updatedDasri = await bsdasriRepository.update(
    { id },
    {
      ...newBsdasri,
      ...synthesizedBsdasriArgs,
      ...synthesizingArgs
    }
  );
  return expandBsdasriFromDB(updatedDasri);
};

export default updateSynthesisBsdasri;
