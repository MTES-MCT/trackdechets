import { Prisma, PrismaClient } from "@prisma/client";
import { CountFormsFn } from "./form/count";
import { CreateFormFn } from "./form/create";
import { SetAppendix2Fn } from "./form/setAppendix2";
import { DeleteFormFn } from "./form/delete";
import { FindAppendix2FormsByIdFn } from "./form/findAppendix2FormsById";
import { FindForwardedInByIdFn } from "./form/findForwardedInById";
import { FindFullFormByIdFn } from "./form/findFullFormById";
import { FindUniqueFormFn } from "./form/findUnique";
import { RemoveAppendix2Fn } from "./form/removeAppendix2";
import { UpdateFormFn } from "./form/update";
import { UpdateManyFormFn } from "./form/updateMany";
import { AcceptRevisionRequestApprovalFn } from "./formRevisionRequest/acceptRevisionRequestApproval";
import { CancelRevisionRequestFn } from "./formRevisionRequest/cancelRevisionRequest";
import { CountRevisionRequestsFn } from "./formRevisionRequest/countRevisionRequest";
import { CreateRevisionRequestFn } from "./formRevisionRequest/createRevisionRequest";
import { GetRevisionRequestByIdFn } from "./formRevisionRequest/getRevisionRequestById";
import { RefuseRevisionRequestFn } from "./formRevisionRequest/refuseRevisionRequestApproval";
import { UpdateAppendix2Forms } from "./form/updateAppendix2Forms";

export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
>;

export type ReadRepositoryFnDeps = { prisma: PrismaTransaction };
export type WriteRepositoryFnDeps = ReadRepositoryFnDeps & {
  user: Express.User;
};
export type RepositoryFnDeps = WriteRepositoryFnDeps;

export interface RepositoryDeps {
  prisma: PrismaClient;
  user: Express.User;
}

export type RepositoryFnBuilder<Fn> = (deps: RepositoryFnDeps) => Fn;

const formWithLinkedObjects = Prisma.validator<Prisma.FormArgs>()({
  include: {
    forwardedIn: true,
    transportSegments: true,
    intermediaries: true
  }
});

export type FullForm = Prisma.FormGetPayload<typeof formWithLinkedObjects>;

export type LogMetadata = Record<string, unknown>;

export type FormActions = {
  findUnique: FindUniqueFormFn;
  findFullFormById: FindFullFormByIdFn;
  findAppendix2FormsById: FindAppendix2FormsByIdFn;
  findForwardedInById: FindForwardedInByIdFn;
  create: CreateFormFn;
  update: UpdateFormFn;
  updateMany: UpdateManyFormFn;
  delete: DeleteFormFn;
  count: CountFormsFn;
  removeAppendix2: RemoveAppendix2Fn;
  setAppendix2: SetAppendix2Fn;
  updateAppendix2Forms: UpdateAppendix2Forms;
};

export type FormRevisionRequestActions = {
  getRevisionRequestById: GetRevisionRequestByIdFn;
  cancelRevisionRequest: CancelRevisionRequestFn;
  createRevisionRequest: CreateRevisionRequestFn;
  acceptRevisionRequestApproval: AcceptRevisionRequestApprovalFn;
  refuseRevisionRequestApproval: RefuseRevisionRequestFn;
  countRevisionRequests: CountRevisionRequestsFn;
};
