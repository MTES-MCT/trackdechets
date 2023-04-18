import { InitialFormResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { isFormReader } from "../permissions";
import quantityGrouped from "./forms/quantityGrouped";

const initialFormResolvers: InitialFormResolvers = {
  emitter: async (parent, _, { user }) => {
    const form = await prisma.form.findUnique({ where: { id: parent.id } });
    if (!form || !(await isFormReader(user!, form))) {
      return null;
    }
    return parent.emitter ?? null;
  },
  quantityGrouped
};

export default initialFormResolvers;
