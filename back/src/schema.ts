import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import scalarResolvers from "./scalars";
import companiesResolvers from "./companies/resolvers";
import usersResolvers from "./users/resolvers";
import formsResolvers from "./forms/resolvers";
import vhuResolvers from "./vhu/resolvers";
import bsdsResolvers from "./bsds/resolvers";
import dasriResolvers from "./dasris/resolvers";

// Merge GraphQL schema by merging types, resolvers and shields
// definitions from differents modules

const repositories = ["users", "companies", "forms", "vhu", "bsds", "dasris"]];

const typeDefsPath = repositories.map(
  repository => `${__dirname}/${repository}/**/*.graphql`
);

const typeDefsArray = loadFilesSync(typeDefsPath);

const typeDefs = mergeTypeDefs(typeDefsArray);

const resolvers = [
  scalarResolvers,
  companiesResolvers,
  formsResolvers,
  usersResolvers,
  vhuResolvers,
  bsdsResolvers,
  dasriResolvers
];

export { typeDefs, resolvers };
