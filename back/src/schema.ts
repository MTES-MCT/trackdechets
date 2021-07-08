import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import scalarResolvers from "./scalars";
import companiesResolvers from "./companies/resolvers";
import usersResolvers from "./users/resolvers";
import formsResolvers from "./forms/resolvers";
import vhuResolvers from "./vhu/resolvers";
import bsdsResolvers from "./bsds/resolvers";
import dasriResolvers from "./bsdasris/resolvers";
import bsffResolvers from "./bsffs/resolvers";
import bsdaResolvers from "./bsda/resolvers";

// Merge GraphQL schema by merging types definitions and resolvers
// from differents modules
const repositories = [
  "common",
  "scalars",
  "users",
  "companies",
  "forms",
  "vhu",
  "bsds",
  "dasris",
  "bsffs",
  "bsda"
];

const typeDefsPath = repositories.map(
  repository => `${__dirname}/${repository}/typeDefs/**/*.graphql`
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
  dasriResolvers,
  bsffResolvers,
  bsdaResolvers
];

export { typeDefs, resolvers };
