import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import scalarResolvers from "./scalars";
import companiesResolvers from "./companies/resolvers";
import usersResolvers from "./users/resolvers";
import formsResolvers from "./forms/resolvers";

// Merge GraphQL schema by merging types, resolvers and shields
// definitions from differents modules

const repositories = ["users", "companies", "forms"];

const typeDefsPath = repositories.map(
  repository => `${__dirname}/${repository}/*.graphql`
);

const typeDefsArray = loadFilesSync(typeDefsPath);

const typeDefs = mergeTypeDefs([
  ...typeDefsArray,
  ...ValidateDirectiveVisitor.getMissingCommonTypeDefs(),
  ...range.getTypeDefs()
]);

const resolvers = [
  scalarResolvers,
  companiesResolvers,
  formsResolvers,
  usersResolvers
];

const schemaDirectives = { range };

export { typeDefs, resolvers, schemaDirectives };
