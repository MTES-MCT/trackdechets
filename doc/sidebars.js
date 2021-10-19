const path = require("path");

const graphqlTypes = [
  "queries",
  "mutations",
  "objects",
  "interfaces",
  "enums",
  "unions",
  "inputObjects",
  "scalars",
];

function makeReference(apiId) {
  return graphqlTypes.map((t) =>
    path.join("reference", "api-reference", apiId, t)
  );
}

const referenceDefs = [
  { id: "bsdd", label: "Déchets dangereux" },
  { id: "bsdasri", label: "DASRI" },
  { id: "bsvhu", label: "VHU" },
  { id: "bsff", label: "Fluides Frigorigènes" },
  { id: "bsda", label: "Amiante" },
  { id: "user-company", label: "Utilisateurs et Établissements" },
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
          Exemples: [
            {
              BSDD: [
                "tutoriels/examples/bsdd/acheminement-direct",
                "tutoriels/examples/bsdd/multi-modal",
                "tutoriels/examples/bsdd/entreposage-provisoire",
                "tutoriels/examples/bsdd/import-bsd-papier",
              ],
              BSDASRI: [
                "tutoriels/examples/bsdasri/acheminement-direct",
                "tutoriels/examples/bsdasri/emport-direct",
              ],
              BSVHU: ["tutoriels/examples/bsvhu/vhu-vers-broyeur"],
              BSFF: ["tutoriels/examples/bsff/collecte-petites-quantites"],
            },
          ],
        },
      ],
    },
    {
      Guides: [
        "guides/playground",
        "guides/language",
        "guides/pdf",
        "guides/registre",
        "guides/sirene",
        "guides/oauth2",
      ],
    },
    {
      Référence: [
        {
          "Référence API ": [...apiReference, "reference/changelog"],
        },
        {
          Statuts: ["reference/statuts/bsdd", "reference/statuts/bsdasri"],
        },
        "reference/multi-bsd",
        "reference/environments/environments",
        "reference/authentification",
        "reference/permissions",
        "reference/identifiants",
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
