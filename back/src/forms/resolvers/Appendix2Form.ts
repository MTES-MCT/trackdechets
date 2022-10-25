import { Appendix2FormResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { isFormContributor } from "../permissions";
import quantityGrouped from "./forms/quantityGrouped";

const appendix2FormResolvers: Appendix2FormResolvers = {
  emitter: async (parent, _, { user }) => {
    const form = await prisma.form.findUnique({ where: { id: parent.id } });
    if (!(await isFormContributor(user, form))) {
      return null;
    }
    return parent.emitter;
  },
  quantityGrouped
};

export default appendix2FormResolvers;
