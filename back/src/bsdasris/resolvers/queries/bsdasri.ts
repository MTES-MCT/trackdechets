import { expandBsdasriFromDB } from "../../converter";

import { MissingIdOrReadableId } from "../../../forms/errors";
import type { QueryResolvers } from "@td/codegen-back";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";

function validateArgs(args: any) {
  if (args.id == null) {
    throw new MissingIdOrReadableId();
  }

  return args;
}

const bsdasriResolver: QueryResolvers["bsdasri"] = async (_, args, context) => {
  // check query level permissions
  const user = checkIsAuthenticated(context);

  const validArgs = validateArgs(args);

  const bsdasri = await getBsdasriOrNotFound(validArgs);

  await checkCanRead(user, bsdasri);
  return expandBsdasriFromDB(bsdasri);
};

export default bsdasriResolver;
