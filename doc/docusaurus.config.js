/** @type {import('@docusaurus/types').DocusaurusConfig} */
const path = require("path");

module.exports = {
  title: "Documentation de l'API Trackdéchets",
  tagline: "Connectez vos systèmes d'information à l'API Trackdéchets",
  url: "https://developers.trackdechets.beta.gouv.fr",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/trackdechets.png",
  organizationName: "MTES-MCT",
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
          href: "https://forum.trackdechets.beta.gouv.fr",
          label: "Support",
          position: "right",
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
              to: "/",
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
        id: "user-company",
        schema: "../back/src/{scalars,users,companies}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/user-company",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdd",
        schema: "../back/src/{scalars,bsds,forms}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsdd",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdasri",
        schema: "../back/src/{scalars,bsds,dasris}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsdasri",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsff",
        schema: "../back/src/{scalars,bsds,bsffs}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsff",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsda",
        schema: "../back/src/{scalars,bsds,bsda}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsda",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsvhu",
        schema: "../back/src/{scalars,bsds,vhu}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsvhu",
      },
    ],
    path.join(__dirname, "workflowDocPlugin"),
  ],
};
