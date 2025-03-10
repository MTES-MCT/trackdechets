import { CountAdminRequestsFn } from "./adminRequest/count";
import { CreateAdminRequestFn } from "./adminRequest/create";
import { FindFirstAdminRequestFn } from "./adminRequest/findFirst";
import { FindManyAdminRequestFn } from "./adminRequest/findMany";
import { UpdateAdminRequestFn } from "./adminRequest/update";

export type AdminRequestActions = {
  // Read
  findFirst: FindFirstAdminRequestFn;
  findMany: FindManyAdminRequestFn;
  count: CountAdminRequestsFn;

  // Write
  create: CreateAdminRequestFn;
  update: UpdateAdminRequestFn;
};
