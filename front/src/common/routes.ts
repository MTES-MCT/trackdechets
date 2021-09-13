export default {
  admin: {
    index: "/admin",
    verification: "/admin/verification",
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
  resetPassword: "/reset-password",
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
    },
    bsdds: {
      create: "/dashboard/:siret/bsdds/create",
      edit: "/dashboard/:siret/bsdds/edit/:id",
      view: "/dashboard/:siret/bsdds/view/:id",
    },
    bsdasris: {
      view: "/dashboard/:siret/bsdasris/view/:id",
      create: "/dashboard/:siret/bsdasris/create",
      createGroup: "/dashboard/:siret/bsdasris/create-group",
      edit: "/dashboard/:siret/bsdasris/edit/:id",
      sign: {
        publish: "/dashboard/:siret/bsdasris/publish/:id",
        directTakeover: "/dashboard/:siret/bsdasris/direct-takeover/:id",
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
    transport: {
      index: "/dashboard/:siret/transport",
      toCollect: "/dashboard/:siret/transport/to-collect",
      collected: "/dashboard/:siret/transport/collected",
    },
  },
  account: {
    index: "/account",
    info: "/account/info",
    companies: "/account/companies",
    api: "/account/api",
  },
};
