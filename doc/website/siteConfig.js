/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
const users = [
  {
    caption: "Trinov",
    image: "/img/partners-logos/trinov.png",
    pinned: true
  },
  {
    caption: "Kerlog",
    image: "/img/partners-logos/kerlog.png",
    pinned: true
  },
  {
    caption: "Chimirec",
    image: "/img/partners-logos/chimirec.png",
    pinned: true
  },
  {
    caption: "Hensel Recycling",
    image: "/img/partners-logos/hensel.png",
    pinned: true
  },
  {
    caption: "Sarpi Veolia",
    image: "/img/partners-logos/sarpi-veolia.png",
    pinned: true
  },
  {
    caption: "Séché Environnement",
    image: "/img/partners-logos/seche.png",
    pinned: true
  }
  ,
  {
    caption: "Caktus",
    image: "/img/partners-logos/caktus.png",
    pinned: true
  },
  {
    caption: "Sarp Veolia",
    image: "/img/partners-logos/sarp.png",
    pinned: true
  }
];

const siteConfig = {
  title: "Trackdéchets Développeurs", // Title for your website.
  tagline:
    "Connectez-vous à l'API Trackdéchets pour une traçabilité 100% dématérialisée",
  baseUrl: "/", // Base URL for your project */
  // For github.io type URLs, you would set the url and baseUrl like:
  //   url: 'https://facebook.github.io',
  //   baseUrl: '/test-site/',

  // Used for publishing and more
  projectName: "td-doc",
  organizationName: "Trackdéchets",
  // For top-level user or org sites, the organization is still the same.
  // e.g., for the https://JoelMarcey.github.io site, it would be set like...
  //   organizationName: 'JoelMarcey'

  // Add custom markdown plugins
  markdownPlugins: [
    // Highlight admonitions (callouts such as tips, warnings, note, important, etc)
    require("remarkable-admonitions")({ icon: "svg-inline" })
  ],

  usePrism: ["graphql"],

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    { doc: "introduction", label: "Documentation" },
    { doc: "api-reference", label: "Référence de l'API" },
    {
      href: "https://api.trackdechets.beta.gouv.fr",
      label: "Playground",
      external: true
    },
    {
      href: "https://forum.trackdechets.beta.gouv.fr",
      label: "Support",
      external: true
    }
  ],

  // If you have users set above, you add it here:
  users,

  /* path to images for header/footer */
  headerIcon: "img/favicon.ico",
  footerIcon: "img/favicon.ico",
  favicon: "img/favicon.ico",

  /* Colors for website */
  colors: {
    primaryColor: "#16a085",
    secondaryColor: "#1abc9c"
  },

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright ${new Date().getFullYear()} Ministère de la Transition Écologique et Solidaire`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: "default"
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ["https://buttons.github.io/buttons.js"],

  // On page navigation for the current documentation page.
  onPageNav: "separate",
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  // ogImage: "img/undraw_online.svg",
  // twitterImage: "img/undraw_tweetstorm.svg",

  // For sites with a sizable amount of content, set collapsible to true.
  // Expand/collapse the links and subcategories under categories.
  docsSideNavCollapsible: true,

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl: "https://github.com/MTES-MCT/trackdechets",

  trackdechetsUrl: "https://trackdechets.beta.gouv.fr",

  roadmapUrl: "https://trello.com/b/2pkc7bFg/trackd%C3%A9chets-roadmap-produit",

  forumUrl: "https://forum.trackdechets.beta.gouv.fr",

  statusUrl: "https://status.trackdechets.beta.gouv.fr",

  playgroundUrl: "https://api.trackdechets.beta.gouv.fr"
};

module.exports = siteConfig;
