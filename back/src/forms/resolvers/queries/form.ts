import {
  QueryResolvers,
  QueryFormArgs
} from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";
import { prisma } from "../../../generated/prisma-client";
import { UserInputError } from "apollo-server-express";
import {
  MissingIdOrReadableId,
  FormNotFound,
  NotFormContributor
} from "../../errors";
import { checkIsAuthenticated } from "../../../common/permissions";
import { canGetForm } from "../../permissions";
import { getUserCompanies } from "../../../companies/queries";

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

  const { id, readableId } = validateArgs(args);

  const form = await prisma.form(id ? { id } : { readableId });

  if (form == null) {
    throw new FormNotFound(args.id || args.readableId);
  }

  const userCompanies = await getUserCompanies(user.id);
  const formOwner = await prisma.form({ id: form.id }).owner();
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();
  const temporaryStorage = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();
  const transportSegments = await prisma
    .form({ id: form.id })
    .transportSegments();

  // user with linked objects
  const fullUser = { ...user, companies: userCompanies };

  // form with linked objects
  const fullForm = {
    ...form,
    owner: formOwner,
    ecoOrganisme,
    temporaryStorage,
    transportSegments
  };

  // check form level permissions
  if (!canGetForm(fullUser, fullForm)) {
    throw new NotFormContributor();
  }

  return expandFormFromDb(form);
};

export default formResolver;
