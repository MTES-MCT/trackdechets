import { CountMfaResetRequestsFn } from "./mfaResetRequest/count";
import { CreateMfaResetRequestFn } from "./mfaResetRequest/create";
import { FindFirstMfaResetRequestFn } from "./mfaResetRequest/findFirst";
import { FindManyMfaResetRequestFn } from "./mfaResetRequest/findMany";
import { UpdateMfaResetRequestFn } from "./mfaResetRequest/update";

export type MfaResetRequestActions = {
  findFirst: FindFirstMfaResetRequestFn;
  findMany: FindManyMfaResetRequestFn;
  count: CountMfaResetRequestsFn;
  create: CreateMfaResetRequestFn;
  update: UpdateMfaResetRequestFn;
};
