import { getUserId } from "../utils";
import { Context } from "../types";
import {
  flattenInoutObjectForDb,
  unflattenObjectFromDb
} from "./form-converter";

export default {
  Query: {
    form: async (parent, { id }, context: Context) => {
      if (!id) {
        return null;
      }

      const userId = getUserId(context);

      const form = context.prisma.form({ id });
      // const formOwner = await form.owner();

      // if (formOwner.id !== userId) {
      //   return null;
      // }

      const dbForm = await form;
      return unflattenObjectFromDb(dbForm);
    },
    forms: async (parent, args, context: Context) => {
      const userId = getUserId(context);

      const forms = await context.prisma.forms({
        where: { owner: { id: userId } }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    }
  },
  Mutation: {
    saveForm: async (parent, { formInput }, context: Context) => {
      const userId = getUserId(context);

      if (formInput.id) {
        return context.prisma.updateForm({
          where: { id: formInput.id },
          data: {
            ...flattenInoutObjectForDb(formInput)
          }
        });
      }

      return context.prisma.createForm({
        ...flattenInoutObjectForDb(formInput),
        owner: { connect: { id: userId } }
      });
    },
    deleteForm: async (parent, { id }, context: Context) => {
      return context.prisma.deleteForm({ id });
    }
  }
};
