import { ReadRepositoryFnDeps } from "../../../common/repository/types";
import { FullForm } from "../../types";

export type FindFullFormByIdFn = (id: string) => Promise<FullForm | null>;

const buildFindFullFormById: (
  deps: ReadRepositoryFnDeps
) => FindFullFormByIdFn =
  ({ prisma }) =>
  id =>
    prisma.form.findUnique({
      where: { id },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true,
        intermediaries: true
      }
    });

export default buildFindFullFormById;
