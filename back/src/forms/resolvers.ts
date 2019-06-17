import { getUserId, getUserIdFromToken } from "../utils";
import { Context } from "../types";
import {
  flattenObjectForDb,
  unflattenObjectFromDb,
  cleanUpNotDuplicatableFieldsInForm
} from "./form-converter";
import { formSchema } from "./validator";
import { getNextStep } from "./workflow";
import { getReadableId } from "./readable-id";
import { getUserCompanies } from "../companies/helper";

export default {
  Form: {
    appendix2Forms: (parent, args, context: Context) => {
      return context.prisma.form({ id: parent.id }).appendix2Forms();
    }
  },
  Query: {
    form: async (parent, { id }, context: Context) => {
      if (!id) {
        // On form creation, there is no id
        return null;
      }

      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);

      const dbForm = await context.prisma.form({ id });
      const formOwner = await context.prisma.form({ id }).owner();
      if (
        formOwner.id !== userId ||
        !userCompanies.find(
          c =>
            c.siret === dbForm.recipientCompanySiret ||
            c.siret === dbForm.emitterCompanySiret
        )
      ) {
        throw new Error("Vous n'êtes pas autorisé à visualiser ce bordereau.");
      }

      return unflattenObjectFromDb(dbForm);
    },
    forms: async (parent, { siret, type }, context: Context) => {
      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);

      // Find on userCompanies to make sure that the siret belongs to the current user
      const selectedCompany =
        userCompanies.find(uc => uc.siret === siret) || userCompanies.shift();

      const formsFilter = {
        ACTOR: {
          OR: [
            { owner: { id: userId } },
            { recipientCompanySiret: selectedCompany.siret },
            { emitterCompanySiret: selectedCompany.siret }
          ]
        },
        TRANSPORTER: {
          transporterCompanySiret: selectedCompany.siret,
          status: "SEALED"
        }
      };

      const forms = await context.prisma.forms({
        where: {
          ...formsFilter[type],
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
    },
    stats: async (parent, args, context: Context) => {
      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);

      return userCompanies.map(async userCompany => {
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

          prev[cur.wasteDetailsCode].incoming =
            Math.round(prev[cur.wasteDetailsCode].incoming * 100) / 100;
          prev[cur.wasteDetailsCode].outgoing =
            Math.round(prev[cur.wasteDetailsCode].outgoing * 100) / 100;

          return prev;
        }, {});

        return {
          company: userCompany,
          stats: Object.keys(stats).map(key => stats[key])
        };
      });
    },
    appendixForms: async (
      parent,
      { emitterSiret, wasteCode },
      context: Context
    ) => {
      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);

      if (!userCompanies.find(c => c.siret === emitterSiret)) {
        throw new Error(
          "Vous n'êtes pas autorisé à créer de bordereau de regroupement pour cette entreprise."
        );
      }

      const forms = await context.prisma.forms({
        where: {
          ...(wasteCode && { wasteDetailsCode: wasteCode }),
          status: "AWAITING_GROUP",
          recipientCompanySiret: emitterSiret,
          isDeleted: false
        }
      });

      return forms.map(f => unflattenObjectFromDb(f));
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
            ...flattenObjectForDb(formContent),
            appendix2Forms: { connect: formContent.appendix2Forms }
          }
        });

        return unflattenObjectFromDb(updatedForm);
      }

      const newForm = await context.prisma.createForm({
        ...flattenObjectForDb(formContent),
        appendix2Forms: { connect: formContent.appendix2Forms },
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
      const userCompanies = await getUserCompanies(userId);
      const sirets = userCompanies.map(c => c.siret);

      const appendix2Forms = await context.prisma.form({ id }).appendix2Forms();
      if (appendix2Forms.length) {
        await context.prisma.updateManyForms({
          where: {
            status: "AWAITING_GROUP",
            OR: appendix2Forms.map(f => ({ id: f.id }))
          },
          data: { status: "GROUPED" }
        });
      }

      return context.prisma.updateForm({
        where: { id },
        data: {
          status: getNextStep(form, sirets)
        }
      });
    },
    markAsSent: async (parent, { id, sentInfo }, context: Context) =>
      markForm(id, sentInfo, context),
    markAsReceived: async (parent, { id, receivedInfo }, context: Context) =>
      markForm(id, receivedInfo, context),
    markAsProcessed: async (
      parent,
      { id, processedInfo },
      context: Context
    ) => {
      const form = await context.prisma.form({ id });

      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);
      const sirets = userCompanies.map(c => c.siret);

      const appendix2Forms = await context.prisma.form({ id }).appendix2Forms();
      if (appendix2Forms.length) {
        await context.prisma.updateManyForms({
          where: { OR: appendix2Forms.map(f => ({ id: f.id })) },
          data: { status: "PROCESSED" }
        });
      }

      return context.prisma.updateForm({
        where: { id },
        data: {
          status: getNextStep({ ...form, ...processedInfo }, sirets),
          ...processedInfo
        }
      });
    },
    signedByTransporter: async (_, { id, signingInfo }, context: Context) => {
      const form = await context.prisma.form({ id });

      const userId = getUserId(context);
      const userCompanies = await getUserCompanies(userId);
      const sirets = userCompanies.map(c => c.siret);

      if (!sirets.includes(form.transporterCompanySiret)) {
        throw new Error(
          "Vous n'êtes pas transporteur de ce bordereau. Vous ne pouvez pas réaliser cette action"
        );
      }

      if (signingInfo.signedByProducer) {
        const userCompanySecurityCode = userCompanies.find(
          c => c.siret === form.transporterCompanySiret
        ).securityCode;

        if (userCompanySecurityCode !== signingInfo.securityCode) {
          throw new Error(
            "Code de sécurité producteur incorrect. En cas de doute vérifiez sa valeur sur votre espace dans l'onglet 'Mon compte'"
          );
        }
      }

      return context.prisma.updateForm({
        where: { id },
        data: {
          sentAt: signingInfo.sentAt,
          signedByTransporter: true,
          ...(signingInfo.signedByProducer && {
            sentBy: signingInfo.sentBy,
            status: getNextStep(form, [form.emitterCompanySiret])
          })
        }
      });
    }
  },
  Subscription: {
    forms: {
      subscribe: async (parent, { token }, context: Context) => {
        // Web socket has no headers so we pass the token as a param
        const userId = getUserIdFromToken(token);
        const userCompanies = await getUserCompanies(userId);

        return context.prisma.$subscribe.form({
          OR: [
            ...userCompanies.map(userCompany => ({
              node: { emitterCompanySiret: userCompany.siret }
            })),
            ...userCompanies.map(userCompany => ({
              node: { recipientCompanySiret: userCompany.siret }
            })),
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
  const userCompanies = await getUserCompanies(userId);
  const sirets = userCompanies.map(c => c.siret);

  return context.prisma.updateForm({
    where: { id },
    data: { status: getNextStep(form, sirets), ...inputParams }
  });
}
