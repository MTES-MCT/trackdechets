const routes = {
  admin: {
    index: "/admin",
    verification: "/admin/verification",
    anonymousCompanies: "/admin/anonymous-companies",
    reindex: "/admin/reindex",
    user: "/admin/user",
    impersonate: "/admin/impersonate"
  },
  login: "/login",
  invite: "/invite",
  membershipRequest: "/membership-request/:id",
  signup: {
    index: "/signup",
    details: "/signup/details",
    activation: "/signup/activation"
  },
  userActivation: "/user-activation",
  resendActivationEmail: "/resend-activation-email",
  passwordResetRequest: "/password-reset-request",
  passwordReset: "/password-reset",
  company: "/company/:orgId",
  wasteTree: "/wasteTree",
  dashboard: {
    index: "/dashboard/:siret",
    roadControl: "/dashboard/:siret/road-control/:id",
    bsds: {
      index: "/dashboard/:siret/bsds/all",
      drafts: "/dashboard/:siret/bsds/drafts",
      act: "/dashboard/:siret/bsds/act",
      follow: "/dashboard/:siret/bsds/follow",
      history: "/dashboard/:siret/bsds/history",
      toReview: "/dashboard/:siret/bsds/to-review/:bsdId?",
      reviewed: "/dashboard/:siret/bsds/reviewed"
    },
    bsdds: {
      create: "/dashboard/:siret/bsdds/create",
      edit: "/dashboard/:siret/bsdds/edit/:id",
      view: "/dashboard/:siret/bsdds/view/:id",
      review: "/dashboard/:siret/bsdds/review/:id"
    },
    bsdasris: {
      view: "/dashboard/:siret/bsdasris/view/:id",

      create: "/dashboard/:siret/bsdasris/create",

      edit: "/dashboard/:siret/bsdasris/edit/:id",
      sign: {
        publish: "/dashboard/:siret/bsdasris/publish/:id",
        directTakeover: "/dashboard/:siret/bsdasris/direct-takeover/:id",
        synthesisTakeover: "/dashboard/:siret/bsdasris/synthesis-takeover/:id",
        emission: "/dashboard/:siret/bsdasris/emission/:id",
        emissionSecretCode:
          "/dashboard/:siret/bsdasris/sign-emitter-secret/:id",
        transporter: "/dashboard/:siret/bsdasris/sign-transporter/:id",
        reception: "/dashboard/:siret/bsdasris/sign-reception/:id",
        operation: "/dashboard/:siret/bsdasris/sign-operation/:id"
      }
    },
    bsvhus: {
      create: "/dashboard/:siret/bsvhus/create",
      edit: "/dashboard/:siret/bsvhus/edit/:id",
      view: "/dashboard/:siret/bsvhus/view/:id"
    },
    bsffs: {
      create: "/dashboard/:siret/bsffs/create",
      edit: "/dashboard/:siret/bsffs/edit/:id",
      view: "/dashboard/:siret/bsffs/view/:id"
    },
    bsdas: {
      create: "/dashboard/:siret/bsdas/create",
      edit: "/dashboard/:siret/bsdas/edit/:id",
      view: "/dashboard/:siret/bsdas/view/:id",
      review: "/dashboard/:siret/bsdas/review/:id"
    },
    transport: {
      index: "/dashboard/:siret/transport",
      toCollect: "/dashboard/:siret/transport/to-collect",
      collected: "/dashboard/:siret/transport/collected"
    }
  },
  account: {
    index: "/account",
    info: "/account/info",
    // Old routes to keep integrations from breaking
    companies: {
      create: {
        simple: "/account/companies/new",
        pro: "/account/companies/professional",
        foreign: "/account/companies/foreign"
      },
      join: "/account/companies/join",
      list: "/account/companies",
      orientation: "/account/companies/create"
    },
    authorizedApplications: "/account/applications",
    tokens: { list: "/account/tokens/list" },
    oauth2: {
      create: "/account/oauth2/create",
      edit: "/account/oauth2/edit/:id",
      list: "/account/oauth2/list"
    }
  },
  companies: {
    index: "/companies",
    create: {
      simple: "/companies/new",
      pro: "/companies/professional",
      foreign: "/companies/foreign"
    },
    join: "/companies/join",
    orientation: "/companies/create"
  },
  registry: "/registre"
};

export function getRelativeRoute(index, route) {
  return route.replace(`${index}/`, "");
}

export default routes;
