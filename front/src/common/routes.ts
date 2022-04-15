export default {
  admin: {
    index: "/admin",
    verification: "/admin/verification",
    anonymousCompany: "/admin/anonymous-company",
  },
  login: "/login",
  invite: "/invite",
  membershipRequest: "/membership-request/:id",
  signup: {
    index: "/signup",
    details: "/signup/details",
    activation: "/signup/activation",
  },
  resendActivationEmail: "/resend-activation-email",
  passwordResetRequest: "/password-reset-request",
  passwordReset: "/password-reset",
  company: "/company/:siret",
  wasteTree: "/wasteTree",
  dashboard: {
    index: "/dashboard/:siret",
    exports: "/dashboard/:siret/exports",
    stats: "/dashboard/:siret/stats",
    bsds: {
      index: "/dashboard/:siret/bsds",
      drafts: "/dashboard/:siret/bsds/drafts",
      act: "/dashboard/:siret/bsds/act",
      follow: "/dashboard/:siret/bsds/follow",
      history: "/dashboard/:siret/bsds/history",
      reviews: "/dashboard/:siret/bsds/review",
    },
    bsdds: {
      create: "/dashboard/:siret/bsdds/create",
      edit: "/dashboard/:siret/bsdds/edit/:id",
      view: "/dashboard/:siret/bsdds/view/:id",
      review: "/dashboard/:siret/bsdds/review/:id",
    },
    bsdasris: {
      view: "/dashboard/:siret/bsdasris/view/:id",
      create: "/dashboard/:siret/bsdasris/create",

      edit: "/dashboard/:siret/bsdasris/edit/:id",
      sign: {
        publish: "/dashboard/:siret/bsdasris/publish/:id",
        directTakeover: "/dashboard/:siret/bsdasris/direct-takeover/:id",
        synthesisEmission: "/dashboard/:siret/bsdasris/synthesis-emission/:id",
        // synthesisTransport: "/dashboard/:siret/bsdasris/synthesis-transport/:id",
        emission: "/dashboard/:siret/bsdasris/emission/:id",
        emissionSecretCode:
          "/dashboard/:siret/bsdasris/sign-emitter-secret/:id",
        transporter: "/dashboard/:siret/bsdasris/sign-transporter/:id",
        reception: "/dashboard/:siret/bsdasris/sign-reception/:id",
        operation: "/dashboard/:siret/bsdasris/sign-operation/:id",
      },
    },
    bsvhus: {
      create: "/dashboard/:siret/bsvhus/create",
      edit: "/dashboard/:siret/bsvhus/edit/:id",
      view: "/dashboard/:siret/bsvhus/view/:id",
    },
    bsffs: {
      create: "/dashboard/:siret/bsffs/create",
      edit: "/dashboard/:siret/bsffs/edit/:id",
      view: "/dashboard/:siret/bsffs/view/:id",
    },
    bsdas: {
      create: "/dashboard/:siret/bsdas/create",
      edit: "/dashboard/:siret/bsdas/edit/:id",
      view: "/dashboard/:siret/bsdas/view/:id",
    },
    transport: {
      index: "/dashboard/:siret/transport",
      toCollect: "/dashboard/:siret/transport/to-collect",
      collected: "/dashboard/:siret/transport/collected",
    },
  },
  account: {
    index: "/account",
    info: "/account/info",
    companies: {
      create: "/account/companies/new",
      list: "/account/companies",
    },
    authorizedApplications: "/account/applications",
    tokens: { list: "/account/tokens/list" },
    oauth2: {
      create: "/account/oauth2/create",
      edit: "/account/oauth2/edit/:id",
      list: "/account/oauth2/list",
    },
  },
};
