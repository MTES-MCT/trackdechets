import { ValidationError } from "apollo-server-express";
import { prisma } from "../../generated/prisma-client";
import {
  ResolversParentTypes,
  QueryFormArgs
} from "../../generated/graphql/types";
import { isReadableId } from "../readable-id";
import { expandFormFromDb } from "../form-converter";

export function byId(id: string): { id: string } | { readableId: string } {
  return isReadableId(id) ? { readableId: id } : { id };
}

export async function form(
  parent: ResolversParentTypes["Query"],
  { id }: QueryFormArgs
) {
  const form = await prisma.form(byId(id));

  if (form == null) {
    throw new ValidationError("Ce bordereau n'existe pas.");
  }

  return expandFormFromDb(form);
}
