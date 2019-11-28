import { rule } from "graphql-shield";
import { Prisma } from "../generated/prisma-client";

type FormSiretsAndOwner = {
  recipientCompanySiret: string;
  emitterCompanySiret: string;
  transporterCompanySiret: string;
  owner: { id: string };
};

export const canAccessForm = rule()(async (_, { id }, ctx) => {
  if (!ctx.user || !id) {
    return false;
  }
  const { formInfos, currentUserSirets } = await getFormAccessInfos(
    id,
    ctx.user.id,
    ctx.prisma
  );

  return (
    formInfos.owner.id === ctx.user.id ||
    currentUserSirets.includes(formInfos.emitterCompanySiret) ||
    currentUserSirets.includes(formInfos.recipientCompanySiret)
  );
});

export const isFormRecipient = rule()(async (_, { id }, ctx) => {
  if (!ctx.user || !id) {
    return false;
  }
  const { formInfos, currentUserSirets } = await getFormAccessInfos(
    id,
    ctx.user.id,
    ctx.prisma
  );

  return currentUserSirets.includes(formInfos.recipientCompanySiret);
});

export const isFormEmitter = rule()(async (_, { id }, ctx) => {
  if (!ctx.user || !id) {
    return false;
  }
  const { formInfos, currentUserSirets } = await getFormAccessInfos(
    id,
    ctx.user.id,
    ctx.prisma
  );

  return currentUserSirets.includes(formInfos.emitterCompanySiret);
});

export const isFormTransporter = rule()(async (_, { id }, ctx) => {
  if (!ctx.user || !id) {
    return false;
  }
  const { formInfos, currentUserSirets } = await getFormAccessInfos(
    id,
    ctx.user.id,
    ctx.prisma
  );

  return currentUserSirets.includes(formInfos.transporterCompanySiret);
});

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
    owner { id }}
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
