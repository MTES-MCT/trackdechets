import { BsdasriResolvers } from "@td/codegen-back";
import { getReadonlyBsdasriRepository } from "../../repository";

import { expandBsdasriFromDB } from "../../converter";

const synthesizedIn: BsdasriResolvers["synthesizedIn"] = async bsdasri => {
  const synthesizedIn = await getReadonlyBsdasriRepository()
    .findRelatedEntity({ id: bsdasri.id })
    .synthesizedIn();
  if (!synthesizedIn) {
    return null;
  }
  return expandBsdasriFromDB(synthesizedIn);
};

export default synthesizedIn;
