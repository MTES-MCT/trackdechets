import { getUserId } from "../utils";
import { Context } from "../types";

export default {
  Query: {
    forms: async (parent, args, context: Context) => {
      const userId = getUserId(context);

      return await context.prisma.forms({ where: { owner: { id: userId } } });
    }
  },
  Mutation: {
    createForm: async (parent, formInput, context: Context) => {
      const userId = getUserId(context);

      return context.prisma.createForm({
        ...formInput,
        owner: { connect: { id: userId } },
        createdAt: new Date()
      });
    },
    deleteForm: async (parent, { id }, context: Context) => {
      return context.prisma.deleteForm({ id });
    }
  }
};
