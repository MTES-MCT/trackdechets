import { DomainError, ErrorCode } from "../common/errors";
import { getUserCompanies } from "../companies/queries";
import {
  prisma,
  StatusLogConnection,
  Company
} from "../generated/prisma-client";
import { GraphQLContext } from "../types";
import { unflattenObjectFromDb } from "./form-converter";
import {
  markAsProcessed,
  markAsReceived,
  markAsSealed,
  markAsSent,
  signedByTransporter
} from "./mutations/mark-as";
import { duplicateForm } from "./mutations";
import { saveForm } from "./mutations/save-form";
import { formPdf } from "./queries/form-pdf";
import forms from "./queries/forms";
import { formsRegister } from "./queries/forms-register";

// formsLifeCycle fragment
const statusLogFragment = `
  fragment StatusLogPaginated on StatusLogConnection {
    aggregate {
      count
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      node {
        id
        loggedAt
        status
        updatedFields
        form {
          id
          readableId
        }
        user {
          id
          email
        }
      }
    }
  }
`;

const companyFragment = `
fragment Company on CompanyAssociation {
  company {
    id
    siret
  }
}
`;

const PAGINATE_BY = 100;

export default {
  Form: {
    appendix2Forms: (parent, args, context: GraphQLContext) => {
      return context.prisma.form({ id: parent.id }).appendix2Forms();
    }
  },
  Query: {
    form: async (_, { id }, context: GraphQLContext) => {
      if (!id) {
        // On form creation, there is no id
        return null;
      }

      const dbForm = await context.prisma.form({ id });
      return unflattenObjectFromDb(dbForm);
    },
    forms,
    formsLifeCycle: async (
      _,
      { siret, loggedAfter, loggedBefore, cursorAfter, cursorBefore, formId },
      context: GraphQLContext
    ) => {
      const userId = context.user.id;

      const userCompanies = await prisma
        .companyAssociations({ where: { user: { id: userId } } })
        .$fragment<{ company: Company }[]>(companyFragment)
        .then(associations => associations.map(a => a.company));

      // User must be associated with a company
      if (!userCompanies.length) {
        throw new Error(
          "Vous n'êtes pas autorisé à consulter le cycle de vie des bordereaux."
        );
      }
      // If user is associated with several companies, siret is mandatory
      if (userCompanies.length > 1 && !siret) {
        throw new Error(
          "Vous devez préciser pour quel siret vous souhaitez consulter"
        );
      }
      // If requested siret does not belong to user, raise an error
      if (!!siret && !userCompanies.map(c => c.siret).includes(siret)) {
        throw new Error("Vous n'avez pas le droit d'accéder au siret précisé");
      }
      // Select user company matching siret or get the first
      const selectedCompany =
        userCompanies.find(uc => uc.siret === siret) || userCompanies.shift();

      const formsFilter = {
        OR: [
          { owner: { id: userId } },
          { recipientCompanySiret: selectedCompany.siret },
          { emitterCompanySiret: selectedCompany.siret },
          {
            transporterCompanySiret: selectedCompany.siret,
            status: "SEALED"
          }
        ]
      };
      const statusLogsCx = await context.prisma
        .statusLogsConnection({
          orderBy: "loggedAt_DESC",
          first: PAGINATE_BY,
          after: cursorAfter,
          before: cursorBefore,
          where: {
            loggedAt_not: null,
            loggedAt_gte: loggedAfter,
            loggedAt_lte: loggedBefore,
            form: { ...formsFilter, isDeleted: false, id: formId }
          }
        })
        .$fragment<
          StatusLogConnection & {
            aggregate: { count: number };
          }
        >(statusLogFragment);

      return {
        statusLogs: statusLogsCx.edges.map(el => el.node),
        ...statusLogsCx.pageInfo,
        count: statusLogsCx.aggregate.count
      };
    },

    stats: async (parent, args, context: GraphQLContext) => {
      const userId = context.user.id;
      const userCompanies = await getUserCompanies(userId);

      return userCompanies.map(async userCompany => {
        const queriedForms = await context.prisma.forms({
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

        const stats = queriedForms.reduce((prev, cur) => {
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
      { siret, wasteCode },
      context: GraphQLContext
    ) => {
      const queriedForms = await context.prisma.forms({
        where: {
          ...(wasteCode && { wasteDetailsCode: wasteCode }),
          status: "AWAITING_GROUP",
          recipientCompanySiret: siret,
          isDeleted: false
        }
      });

      return queriedForms.map(f => unflattenObjectFromDb(f));
    },
    formPdf,
    formsRegister
  },
  Mutation: {
    saveForm,
    deleteForm: async (parent, { id }, context: GraphQLContext) => {
      return context.prisma.updateForm({
        where: { id },
        data: { isDeleted: true }
      });
    },
    duplicateForm: (_parent, { id }, { user }: GraphQLContext) =>
      duplicateForm(id, user.id),
    markAsSealed,
    markAsSent,
    markAsReceived,
    markAsProcessed,
    signedByTransporter
  },
  Subscription: {
    forms: {
      subscribe: async (parent, { token }, context: GraphQLContext) => {
        // Web socket has no headers so we pass the token as a param

        const user = await prisma.accessToken({ token }).user();

        if (!user) {
          throw new DomainError(ErrorCode.UNAUTHENTICATED);
        }

        const userCompanies = await getUserCompanies(user.id);

        return context.prisma.$subscribe.form({
          OR: [
            ...userCompanies.map(userCompany => ({
              node: { emitterCompanySiret: userCompany.siret }
            })),
            ...userCompanies.map(userCompany => ({
              node: { recipientCompanySiret: userCompany.siret }
            })),
            { node: { owner: { id: user.id } } }
          ]
        });
      },
      resolve: payload => {
        return payload;
      }
    }
  }
};
