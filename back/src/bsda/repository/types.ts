import { CountBsdasFn } from "./bsda/count";
import { CreateBsdaFn } from "./bsda/create";
import { DeleteBsdaFn } from "./bsda/delete";
import { FindManyBsdaFn } from "./bsda/findMany";
import { FindRelatedEntityFn } from "./bsda/findRelatedEntity";
import { FindUniqueBsdaFn } from "./bsda/findUnique";
import { UpdateBsdaFn } from "./bsda/update";
import { UpdateManyBsdaFn } from "./bsda/updateMany";

export type BsdaActions = {
  findUnique: FindUniqueBsdaFn;
  findRelatedEntity: FindRelatedEntityFn;
  findMany: FindManyBsdaFn;
  create: CreateBsdaFn;
  update: UpdateBsdaFn;
  updateMany: UpdateManyBsdaFn;
  delete: DeleteBsdaFn;
  count: CountBsdasFn;
};
