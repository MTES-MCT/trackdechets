import {
  MutationResolvers,
  QueryResolvers
} from "../../generated/graphql/types";

import bsda from "./queries/bsda";
import bsdas from "./queries/bsdas";
import bsdaPdf from "./queries/bsdaPdf";
import createBsda from "./mutations/create";
import createDraftBsda from "./mutations/createDraft";
import updateBsda from "./mutations/update";
import signBsda from "./mutations/sign";
import duplicateBsda from "./mutations/duplicate";
import publishBsda from "./mutations/publish";
import deleteBsda from "./mutations/delete";
import { Metadata as BsdaMetadata } from "./BsdaMetadata";
import { Bsda } from "./Bsda";

const Query: QueryResolvers = {
  bsda,
  bsdas,
  bsdaPdf
};
const Mutation: MutationResolvers = {
  createBsda,
  createDraftBsda,
  updateBsda,
  signBsda,
  duplicateBsda,
  publishBsda,
  deleteBsda
};

export default { Query, Mutation, BsdaMetadata, Bsda };
