import { mergeRulesTrees } from "./utils";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import companiesResolvers from "./companies/resolvers";
import usersResolvers from "./users/resolvers";
import formsResolvers from "./forms/resolvers";
import companiesShields from "./companies/shield-tree";

// Merge GraphQL schema by merging types, resolvers and shields
// definitions from differents modules

const repositories = ["users", "companies", "forms"];

const typeDefsPath = repositories.map(
  repository => `${__dirname}/${repository}/*.graphql`
);

const typeDefsArray = loadFilesSync(typeDefsPath);

const typeDefs = mergeTypeDefs(typeDefsArray);

const resolvers = [companiesResolvers, formsResolvers, usersResolvers];

const shieldRulesTree = mergeRulesTrees([companiesShields]);

export { typeDefs, resolvers, shieldRulesTree };
