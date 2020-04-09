const { schemaToJSON, renderSchema } = require("graphql-markdown");
const graphql = require("graphql");

/**
 * GraphQL codegen plugin used to generate the API reference
 * for the documentation in markdown. This script is referenced
 * from the config file codegen.yml.
 * See https://graphql-code-generator.com/docs/custom-codegen/write-your-plugin
 * for more information about graphql codegen plugins
 */

// Docusaurus use this annotation to generate markdown pages
const prologue = `---
id: api-reference
title: Référence de l'API
sidebar_label: Référence de l'API
---`;

module.exports = {
  plugin: (schema, documents, config, info) => {
    const content = [];

    const options = {
      skipTitle: true,
      skipTableOfContents: true,
      prologue,
      printer: txt => content.push(txt)
    };

    return schemaToJSON(schema, { graphql }).then(s => {
      renderSchema(s, options);
      return content.join("\n");
    });
  }
};
