import { getUserId } from "../utils";
import { Context } from "../types";
import {
  flattenInoutObjectForDb,
  unflattenObjectFromDb
} from "./form-converter";
import { formSchema } from "./validator";
import { getNextStep } from "./workflow";
import { getReadableId } from "./readable-id";

export default {
  Query: {
    form: async (parent, { id }, context: Context) => {
      if (!id) {
        return null;
      }

      const userId = getUserId(context);

      const formPromise = context.prisma.form({ id });
      // const formOwner = await form.owner();

      // if (formOwner.id !== userId) {
      //   return null;
      // }

      return formPromise.then(dbForm => unflattenObjectFromDb(dbForm));
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

      const { id, ...formContent } = formInput;
      if (id) {
        return context.prisma.updateForm({
          where: { id },
          data: {
            ...flattenInoutObjectForDb(formContent)
          }
        });
      }

      return context.prisma.createForm({
        ...flattenInoutObjectForDb(formContent),
        readableId: await getReadableId(context),
        owner: { connect: { id: userId } }
      });
    },
    deleteForm: async (parent, { id }, context: Context) => {
      return context.prisma.deleteForm({ id });
    },
    markAsSealed: async (parent, { id }, context: Context) => {
      const form = await context.prisma.form({ id });
      const isValid = await formSchema.isValid(unflattenObjectFromDb(form));

      if (!isValid) {
        throw new Error("Le borderau est incomplet, impossible de le valider.");
      }

      const userId = getUserId(context);
      const userCompany = await context.prisma.user({ id: userId }).company();

      return context.prisma.updateForm({
        where: { id },
        data: { status: getNextStep(form, userCompany.siret) }
      });
    },
    markAsSent: async (parent, { id, sentInfo }, context: Context) =>
      markForm(id, sentInfo, context),
    markAsReceived: async (parent, { id, receivedInfo }, context: Context) =>
      markForm(id, receivedInfo, context),
    markAsProcessed: async (parent, { id, processedInfo }, context: Context) =>
      markForm(id, processedInfo, context)
  }
};

async function markForm(id, inputParams, context: Context) {
  const form = await context.prisma.form({ id });

  const userId = getUserId(context);
  const userCompany = await context.prisma.user({ id: userId }).company();

  return context.prisma.updateForm({
    where: { id },
    data: { status: getNextStep(form, userCompany.siret), ...inputParams }
  });
}
