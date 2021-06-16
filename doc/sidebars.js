const reference = ["bsdd", "bsdasri", "bsvhu", "bsff", "bsda"].map((bs) => ({
  [bs.toUpperCase()]: [
    "queries",
    "mutations",
    "objects",
    "interfaces",
    "enums",
    "unions",
    "inputObjects",
    "scalars",
  ].map((t) => `api-reference/${bs}/${t}`),
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
