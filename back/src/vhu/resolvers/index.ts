import {
  MutationResolvers,
  QueryResolvers,
  BordereauVhuMutationResolvers,
  BordereauVhuQueryResolvers
} from "../../generated/graphql/types";

import findUnique from "./queries/findUnique";
import findMany from "./queries/findMany";
import pdf from "./queries/pdf";
import create from "./mutations/create";
import update from "./mutations/update";
import sign from "./mutations/sign";
import duplicate from "./mutations/duplicate";

const Query: QueryResolvers = {
  bordereauVhu: () => ({
    findUnique: null,
    findMany: null,
    pdf: null
  })
};
const Mutation: MutationResolvers = {
  bordereauVhu: () => ({
    create: null,
    update: null,
    sign: null,
    duplicate: null
  })
};

const BordereauVhuQuery: BordereauVhuQueryResolvers = {
  findUnique,
  findMany,
  pdf
};

const BordereauVhuMutation: BordereauVhuMutationResolvers = {
  create,
  update,
  sign,
  duplicate
};

export default { Query, Mutation, BordereauVhuMutation, BordereauVhuQuery };
