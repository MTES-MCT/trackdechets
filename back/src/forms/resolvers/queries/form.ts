import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../converter";
import { MissingIdOrReadableId } from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanRead } from "../../permissions";
import { getFormOrFormNotFound } from "../../database";
import { UserInputError } from "../../../common/errors";

function validateArgs(args: QueryFormArgs) {
  if (args.id == null && args.readableId == null) {
    throw new MissingIdOrReadableId();
  }
  if (args.id && args.readableId) {
    throw new UserInputError(
      "Vous devez préciser soit un id soit un readableId mais pas les deux"
    );
  }
  return args as { id: string } | { readableId: string };
}

const formResolver: QueryResolvers["form"] = async (_, args, context) => {
  // check query level permissions
  const user = checkIsAuthenticated(context);

  const validArgs = validateArgs(args);

  const form = await getFormOrFormNotFound(validArgs);

  await checkCanRead(user, form);

  return expandFormFromDb(form);
};

export default formResolver;
