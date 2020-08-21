import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";
import { UserInputError } from "apollo-server-express";
import { MissingIdOrReadableId, FormNotFound } from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkCanReadUpdateDeleteForm } from "../../permissions";
import { getFormOrFormNotFound } from "../../database";

function validateArgs(args: QueryFormArgs) {
  if (args.id == null && args.readableId == null) {
    throw new MissingIdOrReadableId();
  }
  if (args.id && args.readableId) {
    throw new UserInputError(
      "Vous devez préciser soit un id soit un readableId mais pas les deux"
    );
  }
  return args;
}

const formResolver: QueryResolvers["form"] = async (_, args, context) => {
  // check query level permissions
  const user = checkIsAuthenticated(context);

  const validArgs = validateArgs(args);

  const form = await getFormOrFormNotFound(validArgs);

  await checkCanReadUpdateDeleteForm(user, form);

  return expandFormFromDb(form);
};

export default formResolver;
