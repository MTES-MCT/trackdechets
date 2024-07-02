import { mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import scalarResolvers from "./scalars";
import companiesResolvers from "./companies/resolvers";
import usersResolvers from "./users/resolvers";
import formsResolvers from "./forms/resolvers";
import vhuResolvers from "./bsvhu/resolvers";
import bsdsResolvers from "./bsds/resolvers";
import dasriResolvers from "./bsdasris/resolvers";
import bsffResolvers from "./bsffs/resolvers";
import bsdaResolvers from "./bsda/resolvers";
import bspaohResolvers from "./bspaoh/resolvers";
import registerResolvers from "./registry/resolvers";
import applicationResolvers from "./applications/resolvers";
import webhookResolvers from "./webhooks/resolvers";
import companyDigestResolvers from "./companydigest/resolvers";

// Merge GraphQL schema by merging types definitions and resolvers
// from differents modules
const repositories = [
  "common",
  "scalars",
  "users",
  "companies",
  "forms",
  "bsvhu",
  "bsds",
  "bsdasris",
  "bsffs",
  "bsda",
  "bspaoh",
  "registry",
  "applications",
  "webhooks",
  "companydigest"
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
  bsdaResolvers,
  bspaohResolvers,
  registerResolvers,
  applicationResolvers,
  webhookResolvers,
  companyDigestResolvers
];

export { typeDefs, resolvers };
