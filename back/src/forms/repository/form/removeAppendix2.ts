import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import buildFindGroupedFormsById from "./findGroupedFormsById";
import buildFindUniqueForm from "./findUnique";
import buildUpdateAppendix2Forms from "./updateAppendix2Forms";

export type RemoveAppendix2Fn = (id: string) => Promise<Form>;

const buildRemoveAppendix2: (deps: RepositoryFnDeps) => RemoveAppendix2Fn =
  ({ prisma, user }) =>
  async id => {
    const findGroupedFormsById = buildFindGroupedFormsById({
      prisma
    });
    const appendix2Forms = await findGroupedFormsById(id);

    if (appendix2Forms.length) {
      // disconnect appendix2
      await prisma.formGroupement.deleteMany({ where: { nextFormId: id } });

      const updateAppendix2Forms = buildUpdateAppendix2Forms({ prisma, user });

      // roll back status
      await updateAppendix2Forms(appendix2Forms);
    }

    const findUniqueForm = buildFindUniqueForm({ prisma });
    return findUniqueForm({ id });
  };

export default buildRemoveAppendix2;
