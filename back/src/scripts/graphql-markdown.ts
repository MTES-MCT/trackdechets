import { renderSchema, schemaToJSON } from "graphql-markdown";
import { schema } from "../server";
import * as graphql from "graphql";
import * as fs from "fs";

// Render GraphQL schema to markdown
// and save as a page in the documentation folder

const content = [];

const options = {
  title: "Référence de l'API GraphQL",
  skipTableOfContents: true,
  printer: (txt: string) => content.push(txt)
};

const filePath = "documentation/api-reference.md";

schemaToJSON(schema, { graphql }).then(s => {
  renderSchema(s, options);
  fs.writeFileSync(filePath, content.join("\n"));
  process.exit(0);
});
