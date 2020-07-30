import { prisma } from "../../generated/prisma-client";
import {
  ResolversParentTypes,
  QueryFormArgs
} from "../../generated/graphql/types";
import { expandFormFromDb } from "../form-converter";
import { MissingIdOrReadableId, FormNotFound } from "../errors";

export async function form(
  parent: ResolversParentTypes["Query"],
  { id, readableId }: QueryFormArgs
) {
  if (id == null && readableId == null) {
    throw new MissingIdOrReadableId();
  }

  const form = await prisma.form(id ? { id } : { readableId });

  if (form == null) {
    throw new FormNotFound(id || readableId);
  }

  return expandFormFromDb(form);
}
