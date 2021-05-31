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
    bsvhus: {
      create: "/dashboard/:siret/bsvhus/create",
      edit: "/dashboard/:siret/bsvhus/edit/:id",
      view: "/dashboard/:siret/bsvhus/view/:id",
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
