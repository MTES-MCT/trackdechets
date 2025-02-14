export function getRelativeRoute(index, route) {
  return route.replace(`${index}/`, "");
}

const routes = {
  admin: {
    index: "/admin",
    verification: "/admin/verification",
    companies: "/admin/companies",
    anonymousCompany: "/admin/anonymous-company",
    reindex: "/admin/reindex",
    user: "/admin/user",
    impersonate: "/admin/impersonate",
    registry: "/admin/registry",
    membersAdmin: "/admin/members",
    bsdAdmin: "/admin/bsd",
    massProfilesAdmin: "/admin/mass-profile"
  },
  login: "/login",
  invite: "/invite",
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
    default: "/dashboard",
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
      },

      review: "/dashboard/:siret/bsdasris/review/:id"
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
    bspaohs: {
      create: "/dashboard/:siret/bspaohs/create",
      edit: "/dashboard/:siret/bspaohs/edit/:id",
      view: "/dashboard/:siret/bspaohs/view/:id"
    },
    transport: {
      index: "/dashboard/:siret/transport",
      toCollect: "/dashboard/:siret/transport/to-collect",
      collected: "/dashboard/:siret/transport/collected",
      return: "/dashboard/:siret/transport/return"
    }
  },
  account: {
    index: "/account",
    info: "/account/info",
    notifications: "/account/notifications",
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
    applications: "/account/applications",
    tokens: { list: "/account/tokens/list" },
    oauth2: {
      create: "/account/oauth2/create",
      edit: "/account/oauth2/edit/:id",
      list: "/account/oauth2/list"
    }
  },
  companies: {
    index: "/companies",
    details: "/companies/:siret",
    create: {
      simple: "/companies/new",
      pro: "/companies/professional",
      foreign: "/companies/foreign"
    },
    join: "/companies/join",
    orientation: "/companies/create"
  },
  registry: "/registre",
  registry_new: {
    index: "/registry",
    myImports: "/registry/own",
    companyImports: "/registry/list",
    export: "/registry/export"
  }
};

export const titles = {
  default: "Trackdéchets",
  "/admin": "Panneau d'administration — Trackdéchets",
  "/admin/verification": "Vérification d'entreprise — Trackdéchets",
  "/admin/companies": "Données entreprises — Trackdéchets",
  "/admin/anonymous-company": "Ajouter une entreprise anonyme — Trackdéchets",
  "/admin/reindex": "Réindéxation de bordereaux — Trackdéchets",
  "/admin/user": "Supprimer un utilisateur — Trackdéchets",
  "/admin/impersonate": "Impersonation — Trackdéchets",
  "/admin/registry": "Registres — Trackdéchets",
  "/admin/members": "Gestion des membres — Trackdéchets",
  "/admin/bsd": "Consultation BSD — Trackdéchets",
  "/admin/mass-profile": "Gestion en masse des profils — Trackdéchets",
  "/login": "Se connecter — Trackdéchets",
  "/invite": "",
  "/signup": "Créer un compte — Trackdéchets",
  "/signup/details": "Liste des codes déchets autorisés — Trackdéchets",
  "/signup/activation": "Se connecter — Trackdéchets",
  "/user-activation": "Activer mon compte utilisateur — Trackdéchets",
  "/resend-activation-email":
    "Renvoyer l'e-mail d'activation de mon compte — Trackdéchets",
  "/password-reset-request":
    "Demande de réinitialisation de mot de passe — Trackdéchets",
  "/password-reset": "Réinitialiser mon mot de passe — Trackdéchets",
  "/company/:orgId": "Fiche établissement — Trackdéchets",
  "/wasteTree": "Liste des codes déchets — Trackdéchets",
  "/dashboard": "Tableau de bord — Trackdéchets",
  "/dashboard/:siret": "Tableau de bord — Trackdéchets",
  "/dashboard/:siret/road-control/:id": "Contrôle Routier — Trackdéchets",
  "/dashboard/:siret/bsds/all": "Tous mes bordereaux — Trackdéchets",
  "/dashboard/:siret/bsds/drafts": "Brouillons — Trackdéchets",
  "/dashboard/:siret/bsds/act": "Pour action — Trackdéchets",
  "/dashboard/:siret/bsds/follow": "Bordereaux suivis — Trackdéchets",
  "/dashboard/:siret/bsds/history": "Bordereaux archivés — Trackdéchets",
  "/dashboard/:siret/bsds/to-review/:bsdId?":
    "Révisions en cours — Trackdéchets",
  "/dashboard/:siret/bsds/reviewed": "Révisions passées — Trackdéchets",
  "/dashboard/:siret/bsdds/create": "Créer un BSDD — Trackdéchets",
  "/dashboard/:siret/bsdds/edit/:id": "Modifier le BSDD — Trackdéchets",
  "/dashboard/:siret/bsdds/view/:id": "Aperçu du BSDD — Trackdéchets",
  "/dashboard/:siret/bsdds/review/:id": "Réviser le BSDD — Trackdéchets",
  "/dashboard/:siret/bsdasris/view/:id": "Aperçu du BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/create": "Créer un BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/edit/:id": "Modifier le BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/publish/:id": "Publier le BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/direct-takeover/:id":
    "Signer l'emport direct du BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/synthesis-takeover/:id":
    "Valider le bordereau de synthèse BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/emission/:id": "",
  "/dashboard/:siret/bsdasris/sign-emitter-secret/:id":
    "Signer le BSDASRI avec le code signature de l'émetteur — Trackdéchets",
  "/dashboard/:siret/bsdasris/sign-transporter/:id":
    "Signer l'enlèvement du BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/sign-reception/:id":
    "Signer la réception du BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/sign-operation/:id":
    "Signer l'opération du BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsdasris/review/:id": "Réviser le BSDASRI — Trackdéchets",
  "/dashboard/:siret/bsvhus/create": "Créer un BSVHU — Trackdéchets",
  "/dashboard/:siret/bsvhus/edit/:id": "Modifier le BSVHU — Trackdéchets",
  "/dashboard/:siret/bsvhus/view/:id": "Aperçu du BSVHU — Trackdéchets",
  "/dashboard/:siret/bsffs/create": "Créer un BSFF — Trackdéchets",
  "/dashboard/:siret/bsffs/edit/:id": "Modifier le BSFF — Trackdéchets",
  "/dashboard/:siret/bsffs/view/:id": "Aperçu du BSFF — Trackdéchets",
  "/dashboard/:siret/bsdas/create": "Créer un BSDA — Trackdéchets",
  "/dashboard/:siret/bsdas/edit/:id": "Modifier le BSDA — Trackdéchets",
  "/dashboard/:siret/bsdas/view/:id": "Aperçu du BSDA — Trackdéchets",
  "/dashboard/:siret/bsdas/review/:id": "Réviser le BSDA — Trackdéchets",
  "/dashboard/:siret/bspaohs/create": "Créer un BSPAOH — Trackdéchets",
  "/dashboard/:siret/bspaohs/edit/:id": "Modifier le BSPAOH — Trackdéchets",
  "/dashboard/:siret/bspaohs/view/:id": "Aperçu du BSPAOH — Trackdéchets",
  "/dashboard/:siret/transport": "Onglet transport — Trackdéchets",
  "/dashboard/:siret/transport/to-collect":
    "Bordereaux à collecter — Trackdéchets",
  "/dashboard/:siret/transport/collected":
    "Bordereaux collectés — Trackdéchets",
  "/dashboard/:siret/transport/return": "Bordereaux en retour — Trackdéchets",
  "/account": "Mon compte — Trackdéchets",
  "/account/info": "Informations sur mon compte — Trackdéchets",
  "/account/companies/new":
    "Ajouter un établissement producteur de déchets — Trackdéchets",
  "/account/companies/professional":
    "Ajouter un établissement gestionnaire de déchets — Trackdéchets",
  "/account/companies/foreign":
    "Ajouter un transporteur étranger, Non-French carrier — Trackdéchets",
  "/account/companies/join": "",
  "/account/companies": "Mes établissements | Trackdéchets",
  "/account/companies/create": "Ajouter un établissement — Trackdéchets",
  "/account/applications": "Applications autorisées — Trackdéchets",
  "/account/tokens/list": "Mes jetons API — Trackdéchets",
  "/account/oauth2/create":
    "Ajouter une application tierce sur la plateforme — Trackdéchets",
  "/account/oauth2/edit/:id":
    "Modifier une application tierce ajoutée sur la plateforme — Trackdéchets",
  "/account/oauth2/list": "Mes applications — Trackdéchets",
  "/companies": "Mes établissements | Trackdéchets",
  "/companies/:siret": "Mon établissement | Trackdéchets",
  "/companies/new":
    "Ajouter un établissement producteur de déchets — Trackdéchets",
  "/companies/professional":
    "Ajouter un établissement gestionnaire de déchets — Trackdéchets",
  "/companies/foreign":
    "Ajouter un transporteur étranger, Non-French carrier — Trackdéchets",
  "/companies/join": "",
  "/companies/create": "Ajouter un établissement — Trackdéchets",
  "/registre": "Mes registres — Trackdéchets",
  "/registry/own": "Mes imports au registre national — Trackdéchets",
  "/registry/list":
    "Imports au registre national par établissement — Trackdéchets",
  "/registry/export": "Mes exports de registres — Trackdéchets"
};

export default routes;
