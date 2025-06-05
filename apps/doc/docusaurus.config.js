/** @type {import('@docusaurus/types').DocusaurusConfig} */
const path = require("path");

module.exports = {
  title: "Documentation technique de l'API Trackdéchets",
  tagline: "Connectez vos systèmes d'information à l'API Trackdéchets",
  url: "https://developers.trackdechets.beta.gouv.fr",
  baseUrl: "/",
  trailingSlash: false,
  onBrokenLinks: "ignore",
  onBrokenMarkdownLinks: "throw",
  favicon: "img/trackdechets.png",
  organizationName: "MTES-MCT",
  projectName: "trackdechets",
  themeConfig: {
    prism: {
      additionalLanguages: ['bash', 'python', 'http', 'json'],
    },
    colorMode: {
      disableSwitch: true
    },
    algolia: {
     // L'ID de l'application fourni par Algolia
     appId: '2UK4UF9U8K',
     // Clé d'API publique : il est possible de la committer en toute sécurité
     apiKey: 'cd706026bcf0dd0df345c4a4f450f844',
     indexName: 'trackdechets',
    },
    navbar: {
      title: "Trackdéchets",
      logo: {
        alt: "Logo Ministère de la Transition Écologique",
        src: "img/mte.svg"
      },
      items: [
        {
          href: "https://forum.trackdechets.beta.gouv.fr",
          label: "Support",
          position: "right"
        },
        {
          href: "https://api.trackdechets.beta.gouv.fr",
          label: "Playground",
          position: "right"
        }
      ]
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "API",
          items: [
            {
              label: "Documentation",
              to: "/"
            },
            {
              label: "Statut de l'API",
              to: "https://status.trackdechets.beta.gouv.fr"
            },
            {
              label: "Playground GraphQL",
              to: "https://api.trackdechets.beta.gouv.fr"
            },
            {
              label: "Code source",
              to: "https://github.com/MTES-MCT/trackdechets"
            }
          ]
        },
        {
          title: "Communauté",
          items: [
            {
              label: "Forum technique",
              href: "https://developers.trackdechets.beta.gouv.fr"
            }
          ]
        },
        {
          title: "Trackdéchets",
          items: [
            {
              label: "Site web",
              to: "https://trackdechets.beta.gouv.fr"
            },
            {
              label: "Ressources",
              to: "https://trackdechets.beta.gouv.fr/resources"
            },
            {
              label: "Application web",
              to: "https://app.trackdechets.beta.gouv.fr"
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ministère de la Transition Écologique`
    }
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/MTES-MCT/trackdechets/edit/dev/doc",
          routeBasePath: "/"
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css")
        }
      }
    ]
  ],
  plugins: [
    [
      "docusaurus-graphql-plugin",
      {
        id: "user-company",
        schema:
          "../../back/src/{scalars,common,users,companies,registryDelegation}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/user-company"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdd",
        schema: "../../back/src/{scalars,common,bsds,forms}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsdd"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsdasri",
        schema:
          "../../back/src/{scalars,common,bsds,bsdasris}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsdasri"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsff",
        schema: "../../back/src/{scalars,common,bsds,bsffs}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsff"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsda",
        schema: "../../back/src/{scalars,common,bsds,bsda}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsda"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bsvhu",
        schema: "../../back/src/{scalars,common,bsds,bsvhu}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bsvhu"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "bspaoh",
        schema: "../../back/src/{scalars,common,bsds,bspaoh}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/bspaoh",
      },
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "registry",
        schema: "../../back/src/{scalars,common,users,companies,registry}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/registre"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "registryV2",
        schema: "../../back/src/{scalars,common,users,companies,registryV2}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/registreV2"
      }
    ],
    [
      "docusaurus-graphql-plugin",
      {
        id: "webhooks",
        schema: "../../back/src/{scalars,common,webhooks}/typeDefs/*.graphql",
        routeBasePath: "/reference/api-reference/webhooks"
      }
    ],
    // plugin used to make workflows examples available with `usePluginData`
    path.join(__dirname, "plugin/build/apps/doc/plugin/index.js")
  ]
};
