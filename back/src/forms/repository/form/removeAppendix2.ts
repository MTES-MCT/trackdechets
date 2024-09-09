import { Form } from "@prisma/client";
import { RepositoryFnDeps } from "../../../common/repository/types";
import buildFindGroupedFormsById from "./findGroupedFormsById";
import buildFindUniqueForm from "./findUnique";
import { enqueueUpdateAppendix2Job } from "../../../queue/producers/updateAppendix2";

export type RemoveAppendix2Fn = (id: string) => Promise<Form>;

const buildRemoveAppendix2: (deps: RepositoryFnDeps) => RemoveAppendix2Fn =
  ({ prisma }) =>
  async id => {
    const findGroupedFormsById = buildFindGroupedFormsById({
      prisma
    });
    const appendix2Forms = await findGroupedFormsById(id);

    if (appendix2Forms.length) {
      // disconnect appendix2
      await prisma.formGroupement.deleteMany({ where: { nextFormId: id } });

      for (const formId of appendix2Forms.map(f => f.id)) {
        prisma.addAfterCommitCallback(async () => {
          await enqueueUpdateAppendix2Job({ formId });
        });
      }
    }

    const findUniqueForm = buildFindUniqueForm({ prisma });
    return findUniqueForm({ id });
  };

export default buildRemoveAppendix2;
