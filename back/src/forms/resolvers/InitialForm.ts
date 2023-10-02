import { InitialFormResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";
import { isFormReader } from "../permissions";

const initialFormResolvers: InitialFormResolvers = {
  emitter: async (parent, _, { user }) => {
    const form = await prisma.form.findUnique({
      where: { id: parent.id },
      include: {
        forwardedIn: { include: { transporters: true } },
        transporters: true,
        grouping: { include: { initialForm: true } },
        intermediaries: true
      }
    });
    if (!form || !(await isFormReader(user!, form))) {
      return null;
    }
    return parent.emitter ?? null;
  }
};

export default initialFormResolvers;
