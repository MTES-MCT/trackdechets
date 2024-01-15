import createBspaohResolver from "./mutations/create";
import createDraftBspaohResolver from "./mutations/createDraft";
import deleteBspaohResolver from "./mutations/delete";
import duplicateBspaohResolver from "./mutations/duplicate";
import publishBspaohResolver from "./mutations/publish";
import updateBspaohResolver from "./mutations/update";
import signeBspaohResolver from "./mutations/sign";
import { MutationResolvers } from "../../generated/graphql/types";

const Mutation: MutationResolvers = {
  createDraftBspaoh: createDraftBspaohResolver,
  createBspaoh: createBspaohResolver,
  deleteBspaoh: deleteBspaohResolver,
  duplicateBspaoh: duplicateBspaohResolver,
  publishBspaoh: publishBspaohResolver,
  updateBspaoh: updateBspaohResolver,
  signBspaoh: signeBspaohResolver
};

export default Mutation;
