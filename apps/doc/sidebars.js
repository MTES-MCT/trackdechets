const path = require("path");

const graphqlTypes = [
  "queries",
  "mutations",
  "objects",
  "enums",
  "inputObjects",
  "scalars",
];

const excludes = [
  path.join("reference", "api-reference", "registre", "mutations"),
];

function makeReference(apiId) {
  return graphqlTypes
    .map((t) => path.join("reference", "api-reference", apiId, t))
    .filter((p) => !excludes.includes(p));
}

const referenceDefs = [
  { id: "bsda", label: "Amiante" },
  { id: "bsdasri", label: "DASRI" },
  { id: "bsdd", label: "Déchets dangereux" },
  { id: "bsff", label: "Fluides Frigorigènes" },
  { id: "bspaoh", label: "Pièces anatomiques d'origine humaine" },
  { id: "bsvhu", label: "VHU" },

  { id: "user-company", label: "Utilisateurs et Établissements" },
  { id: "registre", label: "Registre" },
  { id: "webhooks", label: "Webhooks" },
];

const apiReference = referenceDefs.map(({ id, label }) => ({
  [label]: makeReference(id),
}));

module.exports = {
  docs: [
    "intro",
    {
      Tutoriels: [
        {
          "Démarrage rapide": [
            "tutoriels/quickstart/introduction",
            "tutoriels/quickstart/create-account",
            "tutoriels/quickstart/access-token",
            "tutoriels/quickstart/first-query",
            "tutoriels/quickstart/first-bsd",
          ],
        },
        {
          "Usage Courant": ["tutoriels/courant/query-bordereaux"],
        },
        {
          Exemples: [
            {
              BSDD: [
                "tutoriels/examples/bsdd/acheminement-direct",
                "tutoriels/examples/bsdd/multi-modal",
                "tutoriels/examples/bsdd/multi-modal-v2",
                "tutoriels/examples/bsdd/entreposage-provisoire",
                "tutoriels/examples/bsdd/regroupement",
                "tutoriels/examples/bsdd/import-bsd-papier",
                "tutoriels/examples/bsdd/annexe-1",
              ],
              BSDASRI: [
                "tutoriels/examples/bsdasri/acheminement-direct",
                "tutoriels/examples/bsdasri/emport-direct",
                "tutoriels/examples/bsdasri/acheminement-direct-ecoorganisme",
                "tutoriels/examples/bsdasri/signature-code-secret",
                "tutoriels/examples/bsdasri/signature-code-secret-ecoorganisme",
                "tutoriels/examples/bsdasri/synthese",
                "tutoriels/examples/bsdasri/groupement",
              ],
              BSVHU: ["tutoriels/examples/bsvhu/vhu-vers-broyeur"],
              BSFF: [
                "tutoriels/examples/bsff/collecte-fluides-par-operateur",
                "tutoriels/examples/bsff/groupement",
              ],
              BSDA: [
                "tutoriels/examples/bsda/collecte-chantier",
                "tutoriels/examples/bsda/collecte-chantier-particulier",
                "tutoriels/examples/bsda/groupement",
                "tutoriels/examples/bsda/multi-modal",
              ],
              BSPAOH: [
                "tutoriels/examples/bspaoh/acheminement-direct",
                "tutoriels/examples/bspaoh/acheminement-direct-brouillon",
                "tutoriels/examples/bspaoh/acheminement-direct-depot",
              ],
            },
          ],
        },
      ],
    },
    {
      Guides: [
        "guides/good-practices",
        "guides/playground",
        "guides/language",
        "guides/pdf",
        "guides/registre",
        "guides/sirene",
        "guides/oauth2",
        "guides/openidconnect",
        "guides/webhooks",
      ],
    },
    {
      Référence: [
        {
          "Référence API ": [
            ...apiReference,
            {
              type: "link",
              label: "Changelog",
              href: "https://github.com/MTES-MCT/trackdechets/blob/master/Changelog.md",
            },
          ],
        },
        {
          Statuts: [
            "reference/statuts/bsda",
            "reference/statuts/bsdasri",
            "reference/statuts/bsdd",
            "reference/statuts/bsff",
            "reference/statuts/bspaoh",
          ],
        },
        "reference/multi-bsd",
        "reference/environments/environments",
        "reference/authentification",
        "reference/permissions",
        "reference/identifiants",
        "reference/validation",
        "reference/operationModes",
        "reference/errors",
        "reference/notifications",
        "reference/limitations",
      ],
    },
    {
      Concepts: ["concepts/api-ui", "concepts/graphql"],
    },
  ],
};
