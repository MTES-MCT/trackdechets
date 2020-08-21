import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";
import { UserInputError } from "apollo-server-express";
import {
  MissingIdOrReadableId,
  FormNotFound,
  NotFormContributor
} from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { isFormContributor } from "../../permissions";
import { getFullForm, getFormOrFormNotFound } from "../../database";
import { getFullUser } from "../../../users/database";

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

  if (form == null) {
    throw new FormNotFound(args.id || args.readableId);
  }

  // user with linked objects
  const fullUser = await getFullUser(user);

  // form with linked objects
  const fullForm = await getFullForm(form);

  // check form level permissions
  if (!isFormContributor(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  return expandFormFromDb(form);
};

export default formResolver;
