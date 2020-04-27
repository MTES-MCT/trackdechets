import { fileLoader, mergeTypes, mergeResolvers } from "merge-graphql-schemas";
import { mergeRulesTrees } from "./utils";

// Merge GraphQL schema by merging types, resolvers, permissions and validations
// definitions from differents modules

const typesArray = fileLoader(`${__dirname}/**/*.graphql`, {
  recursive: true
});
const typeDefs = mergeTypes(typesArray, { all: true });

const resolversArray = fileLoader(`${__dirname}/**/resolvers.ts`, {
  recursive: true
});
const resolvers = mergeResolvers(resolversArray);

const shieldRulesTreeArray = fileLoader(`${__dirname}/**/shield-tree.ts`, {
  recursive: true
});

const shieldRulesTree = mergeRulesTrees(shieldRulesTreeArray);

export { typeDefs, resolvers, shieldRulesTree };
