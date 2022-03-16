import { Prisma, PrismaClient } from "@prisma/client";
import { CountFormsFn } from "./form/count";
import { CreateFormFn } from "./form/create";
import { CreateTemporaryStorageFn } from "./form/createTemporaryStorage";
import { DeleteFormFn } from "./form/delete";
import { FindAppendix2FormsByIdFn } from "./form/findAppendix2FormsById";
import { FindFullFormByIdFn } from "./form/findFullFormById";
import { FindUniqueFormFn } from "./form/findUnique";
import { UpdateFormFn } from "./form/update";
import { UpdateManyFormFn } from "./form/updateMany";
import { AcceptRevisionRequestApprovalFn } from "./formRevisionRequest/acceptRevisionRequestApproval";
import { CancelRevisionRequestFn } from "./formRevisionRequest/cancelRevisionRequest";
import { CountRevisionRequestsFn } from "./formRevisionRequest/countRevisionRequest";
import { CreateRevisionRequestFn } from "./formRevisionRequest/createRevisionRequest";
import { GetRevisionRequestByIdFn } from "./formRevisionRequest/getRevisionRequestById";
import { RefuseRevisionRequestFn } from "./formRevisionRequest/refuseRevisionRequestApproval";

export type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"
>;

export interface RepositoryFnDeps {
  prisma: PrismaTransaction;
  user: Express.User;
}

export interface RepositoryDeps {
  prisma: PrismaClient;
  user: Express.User;
}

export type RepositoryFnBuilder<Fn> = (deps: RepositoryFnDeps) => Fn;

const formWithLinkedObjects = Prisma.validator<Prisma.FormArgs>()({
  include: { temporaryStorageDetail: true, transportSegments: true }
});

export type FullForm = Prisma.FormGetPayload<typeof formWithLinkedObjects>;

export type LogMetadata = Record<string, unknown>;

export type FormActions = {
  findUnique: FindUniqueFormFn;
  findFullFormById: FindFullFormByIdFn;
  findAppendix2FormsById: FindAppendix2FormsByIdFn;
  create: CreateFormFn;
  update: UpdateFormFn;
  updateMany: UpdateManyFormFn;
  delete: DeleteFormFn;
  createTemporaryStorage: CreateTemporaryStorageFn;
  count: CountFormsFn;
};

export type FormRevisionRequestActions = {
  getRevisionRequestById: GetRevisionRequestByIdFn;
  cancelRevisionRequest: CancelRevisionRequestFn;
  createRevisionRequest: CreateRevisionRequestFn;
  acceptRevisionRequestApproval: AcceptRevisionRequestApprovalFn;
  refuseRevisionRequestApproval: RefuseRevisionRequestFn;
  countRevisionRequests: CountRevisionRequestsFn;
};
