import { unflattenBsdasri } from "../../converter";

import { MissingIdOrReadableId } from "../../../forms/errors";
import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { checkCanReadBsdasri } from "../../permissions";

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

  await checkCanReadBsdasri(user, bsdasri);
  return unflattenBsdasri(bsdasri);
};

export default bsdasriResolver;
