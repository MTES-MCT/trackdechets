import { Appendix2FormResolvers } from "@trackdechets/codegen/src/back.gen";
import prisma from "../../prisma";
import { isFormContributor } from "../permissions";

const appendix2FormResolvers: Appendix2FormResolvers = {
  emitter: async (parent, _, { user }) => {
    const form = await prisma.form.findUnique({ where: { id: parent.id } });
    if (!(await isFormContributor(user, form))) {
      return null;
    }
    return parent.emitter;
  }
};

export default appendix2FormResolvers;
