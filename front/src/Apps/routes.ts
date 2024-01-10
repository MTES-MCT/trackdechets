const routes = {
  admin: {
    index: "/admin",
    verification: "/admin/verification",
    anonymousCompany: "/admin/anonymous-company",
    reindex: "/admin/reindex",
    user: "/admin/user"
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
  dashboardv2: {
    index: "/v2/dashboard/:siret",
    exports: "/v2/dashboard/:siret/exports",
    roadControl: "/v2/dashboard/:siret/road-control/:id",
    bsds: {
      index: "/v2/dashboard/:siret/bsds/all",
      drafts: "/v2/dashboard/:siret/bsds/drafts",
      act: "/v2/dashboard/:siret/bsds/act",
      follow: "/v2/dashboard/:siret/bsds/follow",
      history: "/v2/dashboard/:siret/bsds/history",
      reviews: "/v2/dashboard/:siret/bsds/review",
      toReviewed: "/v2/dashboard/:siret/bsds/to-review",
      reviewed: "/v2/dashboard/:siret/bsds/reviewed"
    },
    bsdds: {
      create: "/v2/dashboard/:siret/bsdds/create",
      edit: "/v2/dashboard/:siret/bsdds/edit/:id",
      view: "/v2/dashboard/:siret/bsdds/view/:id",
      review: "/v2/dashboard/:siret/bsdds/review/:id"
    },
    bsdasris: {
      view: "/v2/dashboard/:siret/bsdasris/view/:id",

      create: "/v2/dashboard/:siret/bsdasris/create",

      edit: "/v2/dashboard/:siret/bsdasris/edit/:id",
      sign: {
        publish: "/v2/dashboard/:siret/bsdasris/publish/:id",
        directTakeover: "/v2/dashboard/:siret/bsdasris/direct-takeover/:id",
        synthesisTakeover:
          "/v2/dashboard/:siret/bsdasris/synthesis-takeover/:id",
        emission: "/v2/dashboard/:siret/bsdasris/emission/:id",
        emissionSecretCode:
          "/v2/dashboard/:siret/bsdasris/sign-emitter-secret/:id",
        transporter: "/v2/dashboard/:siret/bsdasris/sign-transporter/:id",
        reception: "/v2/dashboard/:siret/bsdasris/sign-reception/:id",
        operation: "/v2/dashboard/:siret/bsdasris/sign-operation/:id"
      }
    },
    bsvhus: {
      create: "/v2/dashboard/:siret/bsvhus/create",
      edit: "/v2/dashboard/:siret/bsvhus/edit/:id",
      view: "/v2/dashboard/:siret/bsvhus/view/:id"
    },
    bsffs: {
      create: "/v2/dashboard/:siret/bsffs/create",
      edit: "/v2/dashboard/:siret/bsffs/edit/:id",
      view: "/v2/dashboard/:siret/bsffs/view/:id"
    },
    bsdas: {
      create: "/v2/dashboard/:siret/bsdas/create",
      edit: "/v2/dashboard/:siret/bsdas/edit/:id",
      view: "/v2/dashboard/:siret/bsdas/view/:id",
      review: "/v2/dashboard/:siret/bsdas/review/:id"
    },
    transport: {
      index: "/v2/dashboard/:siret/transport",
      toCollect: "/v2/dashboard/:siret/transport/to-collect",
      collected: "/v2/dashboard/:siret/transport/collected"
    }
  },
  account: {
    index: "/account",
    info: "/account/info",
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
  }
};

export function getRelativeRoute(index, route) {
  return route.replace(`${index}/`, "");
}

export default routes;
