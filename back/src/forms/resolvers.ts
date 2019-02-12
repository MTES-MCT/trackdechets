import { getUserId, getUserIdFromToken } from "../utils";
import { Context } from "../types";
import {
  flattenInoutObjectForDb,
  unflattenObjectFromDb,
  cleanUpNotDuplicatableFieldsInForm
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
      const userCompany = await context.prisma.user({ id: userId }).company();

      const forms = await context.prisma.forms({
        where: {
          OR: [
            { owner: { id: userId } },
            { recipientCompanySiret: userCompany.siret },
            { emitterCompanySiret: userCompany.siret }
          ],
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    },
    stats: async (parent, args, context: Context) => {
      const userId = getUserId(context);
      const userCompany = await context.prisma.user({ id: userId }).company();

      const forms = await context.prisma.forms({
        where: {
          OR: [
            { owner: { id: userId } },
            { recipientCompanySiret: userCompany.siret },
            { emitterCompanySiret: userCompany.siret }
          ],
          status: "PROCESSED",
          isDeleted: false
        }
      });

      const stats = forms.reduce((prev, cur) => {
        prev[cur.wasteDetailsCode] = prev[cur.wasteDetailsCode] || {
          wasteCode: cur.wasteDetailsCode,
          incoming: 0,
          outgoing: 0
        };
        cur.recipientCompanySiret === userCompany.siret
          ? (prev[cur.wasteDetailsCode].incoming += cur.quantityReceived)
          : (prev[cur.wasteDetailsCode].outgoing += cur.quantityReceived);
        return prev;
      }, {});

      return Object.keys(stats).map(key => stats[key]);
    }
  },
  Mutation: {
    saveForm: async (parent, { formInput }, context: Context) => {
      const userId = getUserId(context);

      const { id, ...formContent } = formInput;
      if (id) {
        const updatedForm = await context.prisma.updateForm({
          where: { id },
          data: {
            ...flattenInoutObjectForDb(formContent)
          }
        });

        return unflattenObjectFromDb(updatedForm);
      }

      const newForm = await context.prisma.createForm({
        ...flattenInoutObjectForDb(formContent),
        readableId: await getReadableId(context),
        owner: { connect: { id: userId } }
      });

      return unflattenObjectFromDb(newForm);
    },
    deleteForm: async (parent, { id }, context: Context) => {
      return context.prisma.updateForm({
        where: { id },
        data: { isDeleted: true }
      });
    },
    duplicateForm: async (parent, { id }, context: Context) => {
      const userId = getUserId(context);

      const existingForm = await context.prisma.form({
        id
      });

      const newForm = await context.prisma.createForm({
        ...cleanUpNotDuplicatableFieldsInForm(existingForm),
        readableId: await getReadableId(context),
        status: "DRAFT",
        owner: { connect: { id: userId } }
      });

      return unflattenObjectFromDb(newForm);
    },
    markAsSealed: async (parent, { id }, context: Context) => {
      const form = await context.prisma.form({ id });
      const isValid = await formSchema.isValid(unflattenObjectFromDb(form));

      if (!isValid) {
        throw new Error(
          `Erreur, le bordereau contient des champs obligatoires non renseignés. Ils apparaitront en rouge lorsque vous <a href="/form/${id}">éditez le formulaire</a>.`
        );
      }

      const userId = getUserId(context);
      const userCompany = await context.prisma.user({ id: userId }).company();

      return context.prisma.updateForm({
        where: { id },
        data: {
          status: getNextStep(form, userCompany.siret)
        }
      });
    },
    markAsSent: async (parent, { id, sentInfo }, context: Context) =>
      markForm(id, sentInfo, context),
    markAsReceived: async (parent, { id, receivedInfo }, context: Context) =>
      markForm(id, receivedInfo, context),
    markAsProcessed: async (parent, { id, processedInfo }, context: Context) =>
      markForm(id, processedInfo, context)
  },
  Subscription: {
    forms: {
      subscribe: async (parent, { token }, context: Context) => {
        // Web socket has no headers so we pass the token as a param
        const userId = getUserIdFromToken(token);
        const userCompany = await context.prisma.user({ id: userId }).company();

        return context.prisma.$subscribe.form({
          OR: [
            { node: { emitterCompanySiret: userCompany.siret } },
            { node: { recipientCompanySiret: userCompany.siret } },
            { node: { owner: { id: userId } } }
          ]
        });
      },
      resolve: payload => {
        return payload;
      }
    }
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
