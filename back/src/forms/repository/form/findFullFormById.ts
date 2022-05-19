import { FullForm } from "../../types";
import { RepositoryFnDeps } from "../types";

export type FindFullFormByIdFn = (id: string) => Promise<FullForm>;

const buildFindFullFormById: (deps: RepositoryFnDeps) => FindFullFormByIdFn =
  ({ prisma }) =>
  id =>
    prisma.form.findUnique({
      where: { id },
      include: {
        forwardedIn: true,
        transportSegments: true,
        intermediaries: true
      }
    });

export default buildFindFullFormById;
