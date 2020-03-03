import { renderSchema, schemaToJSON } from "graphql-markdown";
import { typeDefs } from "../schema";
import * as graphql from "graphql";
import * as fs from "fs";
import { buildSchemaFromTypeDefinitions } from "apollo-server-express";

// Render GraphQL schema to markdown
// and save it as a page in the documentation folder

const content = [];

const options = {
  title: "Référence de l'API GraphQL",
  skipTableOfContents: true,
  printer: (txt: string) => content.push(txt)
};

const filePath = "documentation/api-reference.md";

const schema = buildSchemaFromTypeDefinitions(typeDefs);

schemaToJSON(schema, { graphql }).then(s => {
  renderSchema(s, options);
  fs.writeFileSync(filePath, content.join("\n"));
  process.exit(0);
});
