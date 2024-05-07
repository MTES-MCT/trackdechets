import { ApolloServerPlugin } from "@apollo/server";

export function graphiqlLandingPagePlugin(): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          const html = `
<!DOCTYPE html>     
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }

      #graphiql {
        height: 100vh;
      }
    </style>
    <!--
      This GraphiQL example depends on Promise and fetch, which are available in
      modern browsers, but can be "polyfilled" for older browsers.
      GraphiQL itself depends on React DOM.
      If you do not want to rely on a CDN, you can host these files locally or
      include them directly in your favored resource bundler.
    -->
    <script
      crossorigin
      src="https://unpkg.com/react@18.3.1/umd/react.development.js"
      integrity="sha256-KDSP72yw7Yss7rIt6vgkQo/ROHXYTHPTj3fdIW/CTn8="
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"
      integrity="sha256-+QRKXpw524uxogTf+STlJuwKYh5pW7ad4QNYEb6HCeQ="
    ></script>
    <!--
      These two files can be found in the npm module, however you may wish to
      copy them directly into your environment, or perhaps include them in your
      favored resource bundler.
     -->
    <script
      src="https://unpkg.com/graphiql@3.2.0/graphiql.min.js"
      crossorigin
      integrity="sha256-FC1QdPlDgsjmWJtkJfO6Tt7pKFza/bZuwKtw25R/7m4="
    ></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/graphiql/graphiql.min.css"
      crossorigin
      integrity="sha256-wTzfn13a+pLMB5rMeysPPR1hO7x0SwSeQI+cnw7VdbE="
    />
    <!-- 
      These are imports for the GraphIQL Explorer plugin.
     -->
    <script
      src="https://unpkg.com/@graphiql/plugin-explorer/dist/index.umd.js"
      crossorigin
      integrity="sha256-/KjN0AtQm74p7exR84hK/woqhc2pYBdNQamcxHOkiDA="
    ></script>

    <link
      rel="stylesheet"
      href="https://unpkg.com/@graphiql/plugin-explorer@2.0.0/dist/style.css"
      crossorigin
      integrity="sha256-dihQy2mHNADQqxc3xhWK7pH1w4GVvEow7gKjxdWvTgE="
    />
    <link rel="stylesheet" href="graphiql/styles.css" />
    
  </head>

  <body>
    <div id="graphiql">Loading...</div>
    <script src="graphiql/script.js" type="application/javascript"></script>
  </body>
</html>`;
          return { html };
        }
      };
    }
  };
}
