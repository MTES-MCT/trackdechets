import { rule, and } from "graphql-shield";
import { Prisma } from "../generated/prisma-client";
import {
  isAuthenticated,
  ensureRuleParametersArePresent
} from "../common/rules";
import { ForbiddenError } from "apollo-server-express";

type FormSiretsAndOwner = {
  recipientCompanySiret: string;
  recipientIsTempStorage: boolean;
  emitterCompanySiret: string;
  transporterCompanySiret: string;
  traderCompanySiret: string;
  ecoOrganisme: { siret: string };
  temporaryStorageDetail: {
    destinationCompanySiret: string;
    transporterCompanySiret: string;
  };
  owner: { id: string };
};

export const canAccessForm = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    // this rule is called for form creation, so we have to allow it if form id is empty
    if (!id) {
      return true;
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );
    return (
      formInfos.owner.id === ctx.user.id ||
      [
        formInfos.emitterCompanySiret,
        formInfos.recipientCompanySiret,
        formInfos.ecoOrganisme?.siret,
        formInfos.temporaryStorageDetail?.destinationCompanySiret,
        formInfos.temporaryStorageDetail?.transporterCompanySiret
      ].some(siret => currentUserSirets.includes(siret)) ||
      new ForbiddenError(`Vous n'êtes pas autorisé à accéder à ce bordereau.`)
    );
  })
);

export const isFormRecipient = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    ensureRuleParametersArePresent(id);

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    return (
      currentUserSirets.includes(formInfos.recipientCompanySiret) ||
      new ForbiddenError(`Vous n'êtes pas destinataire de ce bordereau.`)
    );
  })
);

export const isFormEmitter = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    ensureRuleParametersArePresent(id);

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    return (
      currentUserSirets.includes(formInfos.emitterCompanySiret) ||
      new ForbiddenError(`Vous n'êtes pas émetteur de ce bordereau.`)
    );
  })
);

export const isFormTransporter = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    ensureRuleParametersArePresent(id);

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    return (
      currentUserSirets.includes(formInfos.transporterCompanySiret) ||
      new ForbiddenError(`Vous n'êtes pas transporteur de ce bordereau.`)
    );
  })
);

export const isFormTrader = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    ensureRuleParametersArePresent(id);

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    return (
      currentUserSirets.includes(formInfos.traderCompanySiret) ||
      new ForbiddenError(`Vous n'êtes pas négociant de ce bordereau.`)
    );
  })
);

export const isFormTempStorer = and(
  isAuthenticated,
  isFormRecipient,
  rule()(async (_, { id }, ctx) => {
    const form = await ctx.prisma.form({ id });

    return (
      form.recipientIsTempStorage ||
      new ForbiddenError(`Vous n'êtes pas destinataire de ce bordereau.`)
    );
  })
);

async function getFormAccessInfos(
  formId: string,
  userId: string,
  prisma: Prisma
) {
  const formInfos = await prisma.form({ id: formId }).$fragment<
    FormSiretsAndOwner
  >(`
  fragment FormWithOwner on Form {
    recipientCompanySiret
    recipientIsTempStorage
    emitterCompanySiret
    transporterCompanySiret
    traderCompanySiret
    ecoOrganisme { siret }
    temporaryStorageDetail {
      destinationCompanySiret
      transporterCompanySiret
    }
    owner { id }
  }
`);

  const user = await prisma.user({ id: userId }).$fragment<{
    companyAssociations: { company: { siret: string } }[];
  }>(`
  fragment UserSirets on User {
    companyAssociations {
      company {
        siret
      }
    }
  }
`);
  const currentUserSirets = user.companyAssociations.map(a => a.company.siret);

  return { formInfos, currentUserSirets };
}
