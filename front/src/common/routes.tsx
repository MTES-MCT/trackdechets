export const routes = {
  login: "/login",
  invite: "/invite",
  signup: {
    index: "/signup",
    details: "/signup/details",
    activation: "/signup/activation",
  },
  resetPassword: "/reset-password",
  company: "/company/:siret",
  wasteTree: "/wasteTree",
  dashboard: {
    index: "/dashboard/:siret",
    exports: "/dashboard/:siret/exports",
    stats: "/dashboard/:siret/stats",
    slips: {
      index: "/dashboard/:siret/slips",
      drafts: "/dashboard/:siret/slips/drafts",
      act: "/dashboard/:siret/slips/act",
      follow: "/dashboard/:siret/slips/follow",
      history: "/dashboard/:siret/slips/history",
      view: "/dashboard/:siret/slips/view/:id",
    },
    transport: {
      index: "/dashboard/:siret/transport",
      toCollect: "/dashboard/:siret/transport/to-collect",
      collected: "/dashboard/:siret/transport/collected",
    },
  },
  form: {
    create: "/form",
    edit: "/form/:id",
  },
  account: {
    index: "/account",
    info: "/account/info",
    companies: "/account/companies",
    api: "/account/api",
  },
};
