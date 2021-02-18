export default {
  login: "/login",
  invite: "/invite",
  membershipRequest: "/membership-request/:id",
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

      // FIXME: we need a different route depending on the form's type
      // e.g /dashboard/:siret/dasri/:id
      //     /dashboard/:siret/vhu/:id
      // but we could also go with something like:
      // /dashboard/:siret/slips/dasri/:id
      // /dashboard/:siret/slips/vhu/:id
      // it would have the advantage of not creating:
      // /dashboard/:siret/dasris for which we have nothing to show
      view: "/dashboard/:siret/slips/view/:id",
      edit: "/dashboard/:siret/slips/edit/:id",
      create: "/dashboard/:siret/slips/create",
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
