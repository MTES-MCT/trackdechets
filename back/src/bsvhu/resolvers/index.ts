import type { MutationResolvers, QueryResolvers } from "@td/codegen-back";

import bsvhu from "./queries/bsvhu";
import bsvhuPdf from "./queries/bsvhuPdf";
import bsvhus from "./queries/bsvhus";
import createBsvhu from "./mutations/create";
import createDraftBsvhu from "./mutations/createDraft";
import updateBsvhu from "./mutations/update";
import signBsvhu from "./mutations/sign";
import duplicateBsvhu from "./mutations/duplicate";
import publishBsvhu from "./mutations/publish";
import deleteBsvhu from "./mutations/delete";
import createBsvhuTransporter from "./mutations/createBsvhuTransporter";
import updateBsvhuTransporter from "./mutations/updateBsvhuTransporter";
import deleteBsvhuTransporter from "./mutations/deleteBsvhuTransporter";

import BsvhuMetadata from "./BsvhuMetadata";
import Bsvhu from "./Bsvhu";

const Query: QueryResolvers = {
  bsvhu,
  bsvhus,
  bsvhuPdf
};
const Mutation: MutationResolvers = {
  createBsvhu,
  createDraftBsvhu,
  updateBsvhu,
  signBsvhu,
  duplicateBsvhu,
  publishBsvhu,
  deleteBsvhu,
  createBsvhuTransporter,
  updateBsvhuTransporter,
  deleteBsvhuTransporter
};

export default { Query, Mutation, BsvhuMetadata, Bsvhu };
