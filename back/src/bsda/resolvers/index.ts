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
import createBsdaTransporter from "./mutations/createBsdaTransporter";
import updateBsdaTransporter from "./mutations/updateBsdaTransporter";
import deleteBsdaTransporter from "./mutations/deleteBsdaTransporter";
import { Metadata as BsdaMetadata } from "./BsdaMetadata";
import { Bsda } from "./Bsda";
import BsdaRevisionRequest from "./BsdaRevisionRequest";
import { createBsdaRevisionRequest } from "./mutations/revisionRequest/createRevisionRequest";
import { cancelBsdaRevisionRequest } from "./mutations/revisionRequest/cancelRevisionRequest";
import { submitBsdaRevisionRequestApproval } from "./mutations/revisionRequest/submitRevisionRequestApproval";
import { bsdaRevisionRequests } from "./queries/revisionRequests";

const Query: QueryResolvers = {
  bsda,
  bsdas,
  bsdaPdf,
  bsdaRevisionRequests: bsdaRevisionRequests as any
};
const Mutation: MutationResolvers = {
  createBsda,
  createDraftBsda,
  updateBsda,
  signBsda,
  duplicateBsda,
  publishBsda,
  deleteBsda,
  createBsdaTransporter,
  updateBsdaTransporter,
  deleteBsdaTransporter,
  createBsdaRevisionRequest: createBsdaRevisionRequest as any,
  cancelBsdaRevisionRequest,
  submitBsdaRevisionRequestApproval: submitBsdaRevisionRequestApproval as any
};

export default { Query, Mutation, BsdaMetadata, Bsda, BsdaRevisionRequest };
