import { rule, and } from "graphql-shield";
import { Prisma } from "../generated/prisma-client";
import { DomainError, ErrorCode } from "../common/errors";
import {
  isAuthenticated,
  ensureRuleParametersArePresent
} from "../common/rules";

type FormSiretsAndOwner = {
  recipientCompanySiret: string;
  emitterCompanySiret: string;
  transporterCompanySiret: string;
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
      currentUserSirets.includes(formInfos.emitterCompanySiret) ||
      currentUserSirets.includes(formInfos.recipientCompanySiret) ||
      new DomainError(
        `Vous n'êtes pas autorisé à accéder à ce bordereau.`,
        ErrorCode.FORBIDDEN
      )
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
      new DomainError(
        `Vous n'êtes pas destinataire de ce bordereau.`,
        ErrorCode.FORBIDDEN
      )
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
      new DomainError(
        `Vous n'êtes pas émetteur de ce bordereau.`,
        ErrorCode.FORBIDDEN
      )
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
      new DomainError(
        `Vous n'êtes pas transporteur de ce bordereau.`,
        ErrorCode.FORBIDDEN
      )
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
    emitterCompanySiret
    transporterCompanySiret
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
