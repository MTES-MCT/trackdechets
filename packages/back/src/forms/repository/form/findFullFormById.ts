import { FullForm } from "../../types";
import { RepositoryFnDeps } from "../types";

export type FindFullFormByIdFn = (id: string) => Promise<FullForm>;

const buildFindFullFormById: (deps: RepositoryFnDeps) => FindFullFormByIdFn =
  ({ prisma }) =>
  id => {
    return prisma.form.findUnique({
      where: { id },
      include: { temporaryStorageDetail: true, transportSegments: true }
    });
  };

export default buildFindFullFormById;
