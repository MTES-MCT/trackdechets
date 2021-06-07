/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Documentation de l'API Trackdéchets",
  tagline: "Connectez vos systèmes d'information à l'API Trackdéchets",
  url: "https://developers.trackdechets.beta.gouv.fr",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/trackdechets.png",
  organizationName: "Ministère de la Transition Écologique",
  projectName: "trackdechets",
  themeConfig: {
    colorMode: {
      disableSwitch: true,
    },
    navbar: {
      title: "Trackdéchets",
      logo: {
        alt: "Logo Ministère de la Transition Écologique",
        src: "img/mte.svg",
      },
      items: [
        {
          type: "doc",
          docId: "intro",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://api.trackdechets.beta.gouv.fr",
          label: "Playground",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "API",
          items: [
            {
              label: "Documentation",
              to: "/docs/intro",
            },
            {
              label: "Référence de l'API",
              to: "/docs/api-reference",
            },
            {
              label: "Statut de l'API",
              to: "https://status.trackdechets.beta.gouv.fr",
            },
            {
              label: "Playground GraphQL",
              to: "https://api.trackdechets.beta.gouv.fr",
            },
            {
              label: "Code source",
              to: "https://github.com/MTES-MCT/trackdechets",
            },
          ],
        },
        {
          title: "Communauté",
          items: [
            {
              label: "Forum technique",
              href: "https://developers.trackdechets.beta.gouv.fr",
            },
          ],
        },
        {
          title: "Trackdéchets",
          items: [
            {
              label: "Site web",
              to: "https://trackdechets.beta.gouv.fr",
            },
            {
              label: "Ressources",
              to: "https://trackdechets.beta.gouv.fr/resources",
            },
            {
              label: "Application web",
              to: "https://app.trackdechets.beta.gouv.fr",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ministère de la Transition Écologique`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/MTES-MCT/trackdechets/doc",
          routeBasePath: "/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  plugins: [
    [
      "docusaurus-graphql-plugin",
      {
        id: "user",
        schema: "graphql/user.graphql",
        routeBasePath: "/api-reference/user",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdd",
        schema: "graphql/bsdd.graphql",
        routeBasePath: "/api-reference/bsdd",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdasri",
        schema: "graphql/bsdasri.graphql",
        routeBasePath: "/api-reference/bsdasri",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsff",
        schema: "graphql/bsff.graphql",
        routeBasePath: "/api-reference/bsff",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsda",
        schema: "graphql/bsda.graphql",
        routeBasePath: "/api-reference/bsda",
      },
    ],
  ],
};
