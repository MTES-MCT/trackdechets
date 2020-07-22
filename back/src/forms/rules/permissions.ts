import {
  ForbiddenError,
  UserInputError,
  ValidationError
} from "apollo-server-express";
import { rule, and } from "graphql-shield";
import { Prisma, prisma } from "../../generated/prisma-client";
import { isAuthenticated } from "../../common/rules";
import {
  MutationSaveFormArgs,
  MutationCreateFormArgs,
  MutationUpdateFormArgs,
  ResolversParentTypes
} from "../../generated/graphql/types";
import { getUserCompanies } from "../../companies/queries";
import { GraphQLContext } from "../../types";
import {
  EcoOrganismeNotFound,
  NotFormContributor,
  FormNotFound
} from "../errors";
import { byId } from "../queries/form";

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
  transportSegments: [{ transporterCompanySiret: string }];
  currentTransporterSiret: string;
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

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (formInfos.owner.id === ctx.user.id) {
      return true;
    }

    if (
      [
        formInfos.emitterCompanySiret,
        formInfos.recipientCompanySiret,
        formInfos.ecoOrganisme?.siret,
        formInfos.temporaryStorageDetail?.destinationCompanySiret,
        formInfos.temporaryStorageDetail?.transporterCompanySiret
      ].some(siret => currentUserSirets.includes(siret))
    ) {
      return true;
    }

    return new NotFormContributor();
  })
);

const canCreateFormFn = async (
  parent: ResolversParentTypes["Mutation"],
  { createFormInput }: MutationCreateFormArgs,
  ctx: GraphQLContext
) => {
  const userCompanies = await getUserCompanies(ctx.user.id);
  const userSirets = userCompanies.map(c => c.siret);
  const formSirets = [
    createFormInput.emitter?.company?.siret,
    createFormInput.recipient?.company?.siret,
    createFormInput.trader?.company?.siret,
    createFormInput.transporter?.company?.siret
  ].filter(Boolean) as string[];

  if (createFormInput.ecoOrganisme) {
    const eo = await prisma.ecoOrganisme({
      id: createFormInput.ecoOrganisme.id
    });
    if (!eo) {
      return new EcoOrganismeNotFound(createFormInput.ecoOrganisme.id);
    }
    formSirets.push(eo.siret);
  }

  // check at least of company of the user appears on the form
  if (!formSirets.some(siret => userSirets.includes(siret))) {
    return new NotFormContributor();
  }

  return true;
};
export const canCreateForm = rule()(canCreateFormFn);

const canUpdateFormFn = async (
  parent: ResolversParentTypes["Mutation"],
  { updateFormInput }: MutationUpdateFormArgs,
  ctx: GraphQLContext
) => {
  const userCompanies = await getUserCompanies(ctx.user.id);
  const userSirets = userCompanies.map(c => c.siret);

  const form = await prisma.form({ id: updateFormInput.id });
  if (!form) {
    return new FormNotFound(updateFormInput.id);
  }
  const eo = await prisma.form({ id: updateFormInput.id }).ecoOrganisme();

  const formSirets = [
    form.emitterCompanySiret,
    form.traderCompanySiret,
    form.recipientCompanySiret,
    form.transporterCompanySiret,
    ...(eo ? [eo.siret] : [])
  ].filter(Boolean) as string[];

  // check at least of company of the user appears on the form
  if (!formSirets.some(siret => userSirets.includes(siret))) {
    return new NotFormContributor();
  }

  if (updateFormInput.ecoOrganisme) {
    const newEO = await prisma.ecoOrganisme(updateFormInput.ecoOrganisme);

    if (newEO == null) {
      return new EcoOrganismeNotFound(updateFormInput.ecoOrganisme.id);
    }
  }

  return true;
};
export const canUpdateForm = rule()(canUpdateFormFn);

export const canSaveForm = rule()(
  (
    parent: ResolversParentTypes["Mutation"],
    args: MutationSaveFormArgs,
    context: GraphQLContext
  ) => {
    const { id, ...input } = args.formInput;

    if (id) {
      return canUpdateFormFn(
        parent,
        { updateFormInput: { id, ...input } },
        context
      );
    }

    return canCreateFormFn(parent, { createFormInput: input }, context);
  }
);

export const isAllowedToUseAppendix2Forms = rule()(
  async (_, { appendix2Forms }, ctx) => {
    if (!appendix2Forms) {
      return true;
    }
    const currentUserSirets = await getCurrentUserSirets(
      ctx.user.id,
      ctx.prisma
    );

    const forms = await ctx.prisma.forms({
      where: {
        OR: appendix2Forms.map(f => ({ readableId: f.readableId }))
      }
    });

    for (const form of forms) {
      if (
        form.isDeleted ||
        form.status !== "AWAITING_GROUP" ||
        !currentUserSirets.includes(form.recipientCompanySiret)
      ) {
        return new ForbiddenError(
          `Vous ne pouvez pas ajouter le bordereau ${form.readableId} en annexe 2.`
        );
      }
    }

    return true;
  }
);

export const isFormEcoOrganisme = and(
  isAuthenticated,
  rule()(async (_, { id }: { id?: string }, ctx) => {
    if (id == null) {
      return new UserInputError("L'id du bordereau concerné est requis.");
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (currentUserSirets.includes(formInfos.ecoOrganisme?.siret)) {
      return true;
    }

    return new ForbiddenError(`Vous n'êtes pas destinataire de ce bordereau.`);
  })
);

export const isFormRecipient = and(
  isAuthenticated,
  rule()(async (_, { id }: { id?: string }, ctx) => {
    if (id == null) {
      return new UserInputError("L'id du bordereau concerné est requis.");
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (formInfos.recipientIsTempStorage) {
      if (
        currentUserSirets.includes(
          formInfos.temporaryStorageDetail.destinationCompanySiret
        )
      ) {
        return true;
      }

      return new ForbiddenError(
        `Vous n'êtes pas destinataire de ce bordereau.`
      );
    }

    if (currentUserSirets.includes(formInfos.recipientCompanySiret)) {
      return true;
    }

    return new ForbiddenError(`Vous n'êtes pas destinataire de ce bordereau.`);
  })
);

export const isFormEmitter = and(
  isAuthenticated,
  rule()(async (_, { id }: { id?: string }, ctx) => {
    if (id == null) {
      return new UserInputError("L'id du bordereau concerné est requis.");
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (currentUserSirets.includes(formInfos.emitterCompanySiret)) {
      return true;
    }

    return new ForbiddenError(`Vous n'êtes pas émetteur de ce bordereau.`);
  })
);

export const isFormTransporter = and(
  isAuthenticated,
  rule()(async (_, { id }: { id?: string }, ctx) => {
    if (id == null) {
      return new UserInputError("L'id du bordereau concerné est requis.");
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    const segmentSirets = formInfos.transportSegments.map(
      segment => segment.transporterCompanySiret
    );

    if (currentUserSirets.includes(formInfos.transporterCompanySiret)) {
      return true;
    }

    if (
      formInfos.temporaryStorageDetail?.transporterCompanySiret &&
      currentUserSirets.includes(
        formInfos.temporaryStorageDetail.transporterCompanySiret
      )
    ) {
      return true;
    }

    if (!!segmentSirets.filter(el => currentUserSirets.includes(el)).length) {
      return true;
    }

    return new ForbiddenError(`Vous n'êtes pas transporteur de ce bordereau.`);
  })
);

export const isFormTrader = and(
  isAuthenticated,
  rule()(async (_, { id }: { id?: string }, ctx) => {
    if (id == null) {
      return new UserInputError("L'id du bordereau concerné est requis.");
    }

    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (currentUserSirets.includes(formInfos.traderCompanySiret)) {
      return true;
    }

    return new ForbiddenError(`Vous n'êtes pas négociant de ce bordereau.`);
  })
);

export const isFormTempStorer = and(
  isAuthenticated,
  rule()(async (_, { id }, ctx) => {
    const { formInfos, currentUserSirets } = await getFormAccessInfos(
      id,
      ctx.user.id,
      ctx.prisma
    );

    if (formInfos == null) {
      return new ValidationError("Ce bordereau n'existe pas.");
    }

    if (
      formInfos.recipientIsTempStorage &&
      currentUserSirets.includes(formInfos.recipientCompanySiret)
    ) {
      return true;
    }

    return new ForbiddenError(
      `Vous n'êtes pas l'installation d'entreposage ou de reconditionnement de ce bordereau.`
    );
  })
);

export const hasFinalDestination = rule()(async (_, { id }, ctx) => {
  const temporaryStorageDetail = await ctx.prisma
    .form({ id })
    .temporaryStorageDetail();
  const mandatoryKeys = [
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail"
  ];

  const hasFinalDestination = mandatoryKeys.every(
    key => !!temporaryStorageDetail[key]
  );

  return (
    hasFinalDestination ||
    new UserInputError(`Vous devez remplit la destination du bordereau.`)
  );
});

export const canAccessFormsWithoutSiret = and(
  isAuthenticated,
  rule()(async (_, { siret }, ctx) => {
    const currentUserSirets = await getCurrentUserSirets(
      ctx.user.id,
      ctx.prisma
    );

    if (currentUserSirets.length === 1) {
      return siret == null || siret === currentUserSirets[0];
    }

    return new ForbiddenError(
      `Vous appartenez à plusieurs entreprises, vous devez spécifier le SIRET dont vous souhaitez récupérer les bordereaux.`
    );
  })
);

async function getFormAccessInfos(
  formId: string,
  userId: string,
  prisma: Prisma
) {
  const formInfos = await prisma.form(byId(formId))
    .$fragment<FormSiretsAndOwner | null>(`
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
    transportSegments{
      transporterCompanySiret
    }
    owner { id }
    currentTransporterSiret
  }
`);

  const currentUserSirets = await getCurrentUserSirets(userId, prisma);

  return { formInfos, currentUserSirets };
}

export async function getCurrentUserSirets(userId: string, prisma: Prisma) {
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
  return user.companyAssociations.map(a => a.company.siret);
}
