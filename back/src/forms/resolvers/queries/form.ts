import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { TDResolver, isAuthenticated } from "../../../common/resolvers";
import { expandFormFromDb } from "../../form-converter";
import { prisma } from "../../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import { MissingIdOrReadableId, FormNotFound } from "../../errors";

const resolveFn: QueryResolvers["form"] = async (_, { id, readableId }) => {
  const form = await prisma.form(id ? { id } : { readableId });
  if (form == null) {
    throw new FormNotFound(id || readableId);
  }
  return expandFormFromDb(form);
};

const permissions = [isAuthenticated];

const validateFn = (args: QueryFormArgs) => {
  if (args.id == null && args.readableId == null) {
    throw new MissingIdOrReadableId();
  }
  if (args.id && args.readableId) {
    throw new UserInputError(
      "Vous devez préciser soit un id soit un readableId mais pas les deux"
    );
  }
};

const resolver = new TDResolver({
  resolveFn,
  permissions,
  validateFn
});

export default resolver.resolve;
