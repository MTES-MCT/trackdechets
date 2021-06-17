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
  return graphqlTypes.map((t) => path.join("api-reference", apiId, t));
}

const referenceDefs = [
  { id: "bsdd", label: "Déchets dangeureux" },
  { id: "bsdasri", label: "DASRI" },
  { id: "bsvhu", label: "VHU" },
  { id: "bsff", label: "Fluides Frigorigènes" },
  { id: "bsda", label: "Amiante" },
  { id: "user-company", label: "Utilisateurs et Établissements" },
];

const reference = referenceDefs.map(({ id, label }) => ({
  [label]: makeReference(id),
}));

module.exports = {
  docs: [
    "intro",
    {
      Guides: [
        "guides/graphql",
        "guides/oauth2",
        "guides/environments",
        "guides/access-token",
        "guides/playground",
        "guides/sirene",
        "guides/registre",
        "guides/roles",
        "guides/notifications",
        "guides/errors",
      ],
    },
    {
      "Bordereaux de suivi de déchets dangereux": [
        "bsdd/multimodal",
        "bsdd/workflow",
      ],
    },
    {
      "Bordereaux de suivi DASRI": ["bsdasri/regroupement", "bsdasri/workflow"],
    },
    {
      Référence: reference,
    },
  ],
};
