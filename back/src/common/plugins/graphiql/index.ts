import { ApolloServerPlugin } from "@apollo/server";

export function graphiqlLandingPagePlugin(): ApolloServerPlugin {
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          const html = `
          <!DOCTYPE html>
          
          <html>
          
          <head>
            <meta charset=utf-8 />
            <meta name="viewport" content="user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, minimal-ui">
            <title>GraphQL Playground</title>
            <link rel="stylesheet" href="graphiql/styles.css" />
            <link rel="shortcut icon" href="graphiql/favicon.png" />
            <script src="graphiql/middleware.js"></script>
          
          </head>
          
          <body>
            <div id="loading-wrapper">
              <div class="text">Loading
                <span class="dGfHfc">GraphQL Playground</span>
              </div>
            </div>
          
            <div id="root" />
            <script src="graphiql/script.js" type="application/javascript"></script>
          </body>
          </html>`;
          return { html };
        }
      };
    }
  };
}
