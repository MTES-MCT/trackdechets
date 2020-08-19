import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";
import { prisma } from "../../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import { MissingIdOrReadableId, FormNotFound } from "../../errors";
import { checkPermissions, isAuthenticated } from "../../../common/permissions";

const permissions = [isAuthenticated];

const validateArgs = (args: QueryFormArgs) => {
  if (args.id == null && args.readableId == null) {
    throw new MissingIdOrReadableId();
  }
  if (args.id && args.readableId) {
    throw new UserInputError(
      "Vous devez préciser soit un id soit un readableId mais pas les deux"
    );
  }
};

const formResolver: QueryResolvers["form"] = async (
  _,
  { id, readableId },
  context
) => {
  checkPermissions(permissions, context);

  validateArgs({ id, readableId });

  const form = await prisma.form(id ? { id } : { readableId });

  if (form == null) {
    throw new FormNotFound(id || readableId);
  }
  // perform additional object level permissions checks
  // if (!canAccessForm(context.user, form)) {
  //   throw new NotFormContributor();
  // }
  return expandFormFromDb(form);
};

export default formResolver;
