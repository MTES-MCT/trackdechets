import { BsdasriResolvers } from "@td/codegen-back";

import { expandBsdasriFromDB } from "../../converter";
import { getReadonlyBsdasriRepository } from "../../repository";

const groupedIn: BsdasriResolvers["groupedIn"] = async bsdasri => {
  const groupedIn = await getReadonlyBsdasriRepository()
    .findRelatedEntity({ id: bsdasri.id })
    .groupedIn();

  if (!groupedIn) {
    return null;
  }
  return expandBsdasriFromDB(groupedIn);
};

export default groupedIn;
