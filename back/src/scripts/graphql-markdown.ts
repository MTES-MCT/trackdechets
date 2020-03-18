import { renderSchema, schemaToJSON } from "graphql-markdown";
import { typeDefs } from "../schema";
import * as graphql from "graphql";
import * as fs from "fs";
import { buildSchemaFromTypeDefinitions } from "apollo-server-express";

// Render GraphQL schema to markdown
// and save it as a page in the documentation folder

const content = [];

// Docusaurus use this annotation to generate markdown pages
const prologue = `---
id: api-reference
title: Référence de l'API
sidebar_label: Référence de l'API
---
`;

const options = {
  skipTitle: true,
  skipTableOfContents: true,
  prologue,
  printer: (txt: string) => content.push(txt)
};

const filePath = "documentation/api-reference.md";

const schema = buildSchemaFromTypeDefinitions(typeDefs);

schemaToJSON(schema, { graphql }).then(s => {
  renderSchema(s, options);
  fs.writeFileSync(filePath, content.join("\n"));
  process.exit(0);
});
